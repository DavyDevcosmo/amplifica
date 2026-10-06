import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { OTP_EXPIRES_IN_SECONDS, OTP_MAX_ATTEMPTS } from '@/lib/otpConfig'

// Só estado de UI do fluxo de auth — nunca a fonte de verdade da sessão
// (isso é sempre o Prisma, via getSession()). O persist em sessionStorage
// existe só pra um F5 na tela de verificação não zerar o cooldown do
// reenvio nem esquecer qual e-mail estava sendo verificado.
//
// O prazo e as tentativas do código aqui são só ESPELHO do que o servidor
// aplica (ver lib/otpConfig.ts): servem pra mostrar "expira em 4:47" e "mais
// 2 tentativas". Quem decide de verdade é sempre o servidor — se ele disser
// que expirou/esgotou, a UI se alinha via expireOtp()/exhaustOtp().
type AuthFlowState = {
  pendingEmail: string | null
  // e-mail da recuperação de senha (o código de 6 dígitos vai pra ele)
  resetEmail: string | null
  resendAvailableAt: number | null
  lockedUntil: number | null
  // quando o código atual vence (epoch ms) e quantos erros ainda cabem
  otpExpiresAt: number | null
  otpAttemptsLeft: number | null
  // Código da redefinição já conferido no passo anterior, guardado só em
  // memória (fora do persist, de propósito): o servidor exige o código de novo
  // ao trocar a senha. Um F5 devolve a pessoa pro passo do código.
  verifiedResetOtp: string | null
  setPendingEmail: (email: string | null) => void
  setResetEmail: (email: string | null) => void
  setResendAvailableAt: (timestamp: number | null) => void
  setLockedUntil: (timestamp: number | null) => void
  startOtpWindow: () => void
  registerOtpFailure: () => void
  expireOtp: () => void
  exhaustOtp: () => void
  setVerifiedResetOtp: (otp: string | null) => void
  reset: () => void
}

export const useAuthFlowStore = create<AuthFlowState>()(
  persist(
    (set) => ({
      pendingEmail: null,
      resetEmail: null,
      resendAvailableAt: null,
      lockedUntil: null,
      otpExpiresAt: null,
      otpAttemptsLeft: null,
      verifiedResetOtp: null,
      setPendingEmail: (email) => set({ pendingEmail: email }),
      setResetEmail: (email) => set({ resetEmail: email }),
      setResendAvailableAt: (timestamp) => set({ resendAvailableAt: timestamp }),
      setLockedUntil: (timestamp) => set({ lockedUntil: timestamp }),
      // chamado sempre que um código novo é enviado (o servidor zera as tentativas)
      startOtpWindow: () =>
        set({
          otpExpiresAt: Date.now() + OTP_EXPIRES_IN_SECONDS * 1000,
          otpAttemptsLeft: OTP_MAX_ATTEMPTS,
          verifiedResetOtp: null,
        }),
      registerOtpFailure: () =>
        set((state) => ({
          otpAttemptsLeft: Math.max(0, (state.otpAttemptsLeft ?? OTP_MAX_ATTEMPTS) - 1),
        })),
      expireOtp: () => set({ otpExpiresAt: Date.now(), verifiedResetOtp: null }),
      exhaustOtp: () => set({ otpAttemptsLeft: 0, verifiedResetOtp: null }),
      setVerifiedResetOtp: (otp) => set({ verifiedResetOtp: otp }),
      reset: () =>
        set({
          pendingEmail: null,
          resetEmail: null,
          resendAvailableAt: null,
          lockedUntil: null,
          otpExpiresAt: null,
          otpAttemptsLeft: null,
          verifiedResetOtp: null,
        }),
    }),
    {
      name: 'amplifica-auth-flow',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        pendingEmail: state.pendingEmail,
        resetEmail: state.resetEmail,
        resendAvailableAt: state.resendAvailableAt,
        otpExpiresAt: state.otpExpiresAt,
        otpAttemptsLeft: state.otpAttemptsLeft,
      }),
    },
  ),
)
