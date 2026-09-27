import { beforeEach, describe, expect, test } from 'vitest'
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
})
