import { beforeEach, describe, expect, test } from 'vitest'
import { OTP_EXPIRES_IN_SECONDS, OTP_MAX_ATTEMPTS } from '@/lib/otpConfig'
import { useAuthFlowStore } from './authFlowStore'

beforeEach(() => {
  useAuthFlowStore.getState().reset()
})

describe('authFlowStore', () => {
  test('começa vazio', () => {
    const state = useAuthFlowStore.getState()
    expect(state.pendingEmail).toBeNull()
    expect(state.resendAvailableAt).toBeNull()
    expect(state.lockedUntil).toBeNull()
  })

  test('guarda o e-mail pendente de verificação', () => {
    useAuthFlowStore.getState().setPendingEmail('user@example.com')
    expect(useAuthFlowStore.getState().pendingEmail).toBe('user@example.com')
  })

  test('guarda o horário do próximo reenvio e do bloqueio', () => {
    const resendAt = Date.now() + 60_000
    const lockedAt = Date.now() + 120_000
    useAuthFlowStore.getState().setResendAvailableAt(resendAt)
    useAuthFlowStore.getState().setLockedUntil(lockedAt)

    expect(useAuthFlowStore.getState().resendAvailableAt).toBe(resendAt)
    expect(useAuthFlowStore.getState().lockedUntil).toBe(lockedAt)
  })

  test('reset limpa tudo de volta', () => {
    useAuthFlowStore.getState().setPendingEmail('user@example.com')
    useAuthFlowStore.getState().setResendAvailableAt(Date.now())
    useAuthFlowStore.getState().reset()

    const state = useAuthFlowStore.getState()
    expect(state.pendingEmail).toBeNull()
    expect(state.resendAvailableAt).toBeNull()
  })

  describe('janela do código', () => {
    test('startOtpWindow: prazo de 5 minutos e 3 tentativas', () => {
      const before = Date.now()
      useAuthFlowStore.getState().startOtpWindow()

      const state = useAuthFlowStore.getState()
      expect(OTP_EXPIRES_IN_SECONDS).toBe(300)
      expect(OTP_MAX_ATTEMPTS).toBe(3)
      expect(state.otpAttemptsLeft).toBe(3)
      expect(state.otpExpiresAt).toBeGreaterThanOrEqual(before + 300_000)
    })

    test('registerOtpFailure desconta uma tentativa por erro e para em zero', () => {
      const store = useAuthFlowStore.getState()
      store.startOtpWindow()

      store.registerOtpFailure()
      expect(useAuthFlowStore.getState().otpAttemptsLeft).toBe(2)
      store.registerOtpFailure()
      store.registerOtpFailure()
      store.registerOtpFailure()
      expect(useAuthFlowStore.getState().otpAttemptsLeft).toBe(0)
    })

    test('expireOtp e exhaustOtp alinham a UI com o servidor e descartam o código conferido', () => {
      const store = useAuthFlowStore.getState()
      store.startOtpWindow()
      store.setVerifiedResetOtp('123456')
      store.exhaustOtp()
      expect(useAuthFlowStore.getState().otpAttemptsLeft).toBe(0)
      expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()

      store.startOtpWindow()
      store.setVerifiedResetOtp('123456')
      store.expireOtp()
      expect(useAuthFlowStore.getState().otpExpiresAt).toBeLessThanOrEqual(Date.now())
      expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()
    })

    test('um código novo (startOtpWindow) zera as tentativas e descarta o código conferido', () => {
      const store = useAuthFlowStore.getState()
      store.startOtpWindow()
      store.registerOtpFailure()
      store.setVerifiedResetOtp('123456')

      store.startOtpWindow()
      expect(useAuthFlowStore.getState().otpAttemptsLeft).toBe(3)
      expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()
    })

    test('o código conferido não vai pro sessionStorage', () => {
      useAuthFlowStore.getState().setVerifiedResetOtp('123456')
      expect(sessionStorage.getItem('amplifica-auth-flow') ?? '').not.toContain(
        '123456',
      )
    })
  })
})
