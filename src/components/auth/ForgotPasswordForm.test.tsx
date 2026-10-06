import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ForgotPasswordForm } from './ForgotPasswordForm'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/actions/authActions', () => ({
  forgotPasswordAction: vi.fn(),
}))

const { forgotPasswordAction } = await import('@/actions/authActions')

beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
})

describe('ForgotPasswordForm', () => {
  test('e-mail inválido: erro no campo, sem chamar a action', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('E-mail'), 'não-é-email')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    expect(await screen.findByText('Digite um e-mail válido.')).toBeInTheDocument()
    expect(forgotPasswordAction).not.toHaveBeenCalled()
  })

  test('sucesso: guarda o e-mail, inicia o cooldown e a janela do código e vai para /password/code', async () => {
    vi.mocked(forgotPasswordAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/password/code'))
    expect(forgotPasswordAction).toHaveBeenCalledWith({ email: 'user@example.com' })
    const state = useAuthFlowStore.getState()
    expect(state.resetEmail).toBe('user@example.com')
    expect(state.resendAvailableAt).toBeGreaterThan(Date.now())
    expect(state.otpAttemptsLeft).toBe(3)
    expect(state.otpExpiresAt).toBeGreaterThan(Date.now() + 299_000)
  })
})
