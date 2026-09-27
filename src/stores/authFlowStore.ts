import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Só estado de UI do fluxo de auth — nunca a fonte de verdade da sessão
// (isso é sempre o Prisma, via getSession()). O persist em sessionStorage
// existe só pra um F5 na tela de verificação não zerar o cooldown do
// reenvio nem esquecer qual e-mail estava sendo verificado.
type AuthFlowState = {
  pendingEmail: string | null
  resendAvailableAt: number | null
  lockedUntil: number | null
  setPendingEmail: (email: string | null) => void
  setResendAvailableAt: (timestamp: number | null) => void
  setLockedUntil: (timestamp: number | null) => void
  reset: () => void
}

export const useAuthFlowStore = create<AuthFlowState>()(
  persist(
    (set) => ({
      pendingEmail: null,
      resendAvailableAt: null,
      lockedUntil: null,
      setPendingEmail: (email) => set({ pendingEmail: email }),
      setResendAvailableAt: (timestamp) => set({ resendAvailableAt: timestamp }),
      setLockedUntil: (timestamp) => set({ lockedUntil: timestamp }),
      reset: () =>
        set({ pendingEmail: null, resendAvailableAt: null, lockedUntil: null }),
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
        resendAvailableAt: state.resendAvailableAt,
      }),
    },
  ),
)
