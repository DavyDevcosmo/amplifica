import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ResetPasswordForm } from './ResetPasswordForm'

const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

vi.mock('@/actions/authActions', () => ({
  resetPasswordAction: vi.fn(),
}))

const { resetPasswordAction } = await import('@/actions/authActions')

// estado de quem já passou pelo passo do código
beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
  useAuthFlowStore.getState().startOtpWindow()
  useAuthFlowStore.setState({
    resetEmail: 'user@example.com',
    verifiedResetOtp: '123456',
  })
})

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { password = 'novasenha1', confirm = 'novasenha1' } = {},
) {
  await user.type(screen.getByLabelText('Nova senha'), password)
  await user.type(screen.getByLabelText('Confirmar nova senha'), confirm)
}

describe('ResetPasswordForm', () => {
  test('só pede a nova senha e a confirmação — sem campo de código', () => {
    renderWithIntl(<ResetPasswordForm />)

    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument()
    expect(document.querySelector('input[autocomplete="one-time-code"]')).toBeNull()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  test('sem e-mail na store (depois de hidratar): volta para /password/forgot', async () => {
    useAuthFlowStore.setState({ resetEmail: null })
    renderWithIntl(<ResetPasswordForm />)

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/password/forgot'))
  })

  test('sem código conferido (acesso direto ou F5): volta para /password/code', async () => {
    useAuthFlowStore.setState({ verifiedResetOtp: null })
    renderWithIntl(<ResetPasswordForm />)

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/password/code'))
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
  })

  test('senhas diferentes: erro no campo de confirmação, sem chamar a action', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm />)

    await fillForm(user, { confirm: 'outraSenha123' })
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(resetPasswordAction).not.toHaveBeenCalled()
  })

  test('sucesso: manda e-mail, código e só a senha; limpa o fluxo e vai para o login', async () => {
    vi.mocked(resetPasswordAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    await waitFor(() => {
      expect(resetPasswordAction).toHaveBeenCalledWith({
        email: 'user@example.com',
        otp: '123456',
        password: 'novasenha1',
      })
      expect(pushMock).toHaveBeenCalledWith('/login?senha=redefinida')
    })
    const state = useAuthFlowStore.getState()
    expect(state.resetEmail).toBeNull()
    expect(state.verifiedResetOtp).toBeNull()
    // o reset() da store não pode virar um redirect para /password/forgot
    expect(replaceMock).not.toHaveBeenCalled()
  })

  test('código venceu no servidor: descarta o código e volta para /password/code', async () => {
    vi.mocked(resetPasswordAction).mockResolvedValue({
      success: false,
      error: 'Código expirado. Peça um novo.',
      code: 'OTP_EXPIRED',
    })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/password/code'))
    expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()
    expect(pushMock).not.toHaveBeenCalled()
  })

  test('outro erro (ex.: senha recusada): mostra o texto e continua na tela', async () => {
    vi.mocked(resetPasswordAction).mockResolvedValue({
      success: false,
      error: 'Não foi possível completar a ação. Tente novamente.',
    })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(
      await screen.findByText('Não foi possível completar a ação. Tente novamente.'),
    ).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
    expect(useAuthFlowStore.getState().verifiedResetOtp).toBe('123456')
  })

  test('mostra quanto falta pro código vencer e, ao vencer, volta para /password/code', async () => {
    vi.useFakeTimers()
    renderWithIntl(<ResetPasswordForm />)
    expect(screen.getByRole('timer')).toHaveTextContent('O código expira em 5:00')

    await vi.advanceTimersByTimeAsync(301_000)

    expect(replaceMock).toHaveBeenCalledWith('/password/code')
    expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()
    vi.useRealTimers()
  })
})
