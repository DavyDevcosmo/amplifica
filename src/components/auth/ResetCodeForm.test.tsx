import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ResetCodeForm } from './ResetCodeForm'

const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

vi.mock('@/actions/authActions', () => ({
  verifyResetCodeAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
}))

const { verifyResetCodeAction, forgotPasswordAction } = await import(
  '@/actions/authActions'
)

const WRONG_CODE = {
  success: false,
  error: 'Código inválido.',
  code: 'INVALID_OTP',
} as const

beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
  useAuthFlowStore.getState().startOtpWindow()
  useAuthFlowStore.setState({ resetEmail: 'user@example.com' })
})

function otpInput() {
  return document.querySelector('input[autocomplete="one-time-code"]') as HTMLElement
}

async function submitCode(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.click(otpInput())
  await user.keyboard(code)
  await user.click(screen.getByRole('button', { name: 'Verificar código' }))
}

describe('ResetCodeForm', () => {
  test('mostra o e-mail do código em negrito e o link para trocar de e-mail', () => {
    renderWithIntl(<ResetCodeForm />)

    expect(screen.getByText('user@example.com').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'Usar outro e-mail' })).toHaveAttribute(
      'href',
      '/password/forgot',
    )
  })

  test('só pede o código: sem campos de senha', () => {
    renderWithIntl(<ResetCodeForm />)

    expect(otpInput()).toBeTruthy()
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Confirmar nova senha')).not.toBeInTheDocument()
  })

  test('sem e-mail na store (depois de hidratar): volta para /password/forgot', async () => {
    useAuthFlowStore.setState({ resetEmail: null })
    renderWithIntl(<ResetCodeForm />)

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/password/forgot'))
  })

  test('mostra as 3 tentativas e o prazo de 5 minutos', () => {
    renderWithIntl(<ResetCodeForm />)

    expect(screen.getByText('Você tem 3 tentativas')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent(
      /O código expira em (4:5\d|5:00)/,
    )
  })

  test('código incompleto: pede os 6 dígitos, sem chamar a action', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await submitCode(user, '123')

    expect(await screen.findByText('O código tem 6 dígitos')).toBeInTheDocument()
    expect(verifyResetCodeAction).not.toHaveBeenCalled()
  })

  test('código certo: guarda o código e segue para /password/reset', async () => {
    vi.mocked(verifyResetCodeAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await submitCode(user, '123456')

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/password/reset'))
    expect(verifyResetCodeAction).toHaveBeenCalledWith({
      email: 'user@example.com',
      otp: '123456',
    })
    expect(useAuthFlowStore.getState().verifiedResetOtp).toBe('123456')
  })

  test('código errado: avisa, desconta uma tentativa e não avança', async () => {
    vi.mocked(verifyResetCodeAction).mockResolvedValue(WRONG_CODE)
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await submitCode(user, '111111')

    expect(
      await screen.findByText('Código incorreto. Confira os dígitos e tente de novo.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Você tem mais 2 tentativas')).toBeInTheDocument()
    expect(otpInput()).toHaveAttribute('aria-invalid', 'true')
    expect(pushMock).not.toHaveBeenCalled()
    expect(useAuthFlowStore.getState().verifiedResetOtp).toBeNull()
  })

  test('3ª tentativa errada: bloqueia a verificação e libera um código novo sem esperar o cooldown', async () => {
    useAuthFlowStore.setState({
      otpAttemptsLeft: 1,
      resendAvailableAt: Date.now() + 60_000,
    })
    vi.mocked(verifyResetCodeAction).mockResolvedValue(WRONG_CODE)
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await submitCode(user, '111111')

    expect(
      await screen.findByText(
        'Você atingiu o limite de tentativas. Peça um novo código para continuar.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Você tem mais/)).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Verificar código' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
  })

  test('servidor diz que expirou: mostra o aviso e libera o reenvio', async () => {
    useAuthFlowStore.setState({ resendAvailableAt: Date.now() + 60_000 })
    vi.mocked(verifyResetCodeAction).mockResolvedValue({
      success: false,
      error: 'Código expirado. Peça um novo.',
      code: 'OTP_EXPIRED',
    })
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await submitCode(user, '123456')

    expect(
      await screen.findByText(
        'Esse código expirou. Peça um novo código para continuar.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
  })

  test('reenviar: pede código pelo e-mail da store e abre uma janela nova', async () => {
    useAuthFlowStore.setState({ otpAttemptsLeft: 0, resendAvailableAt: null })
    vi.mocked(forgotPasswordAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<ResetCodeForm />)

    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))

    await waitFor(() => {
      expect(forgotPasswordAction).toHaveBeenCalledWith({ email: 'user@example.com' })
    })
    expect(await screen.findByText('Código reenviado.')).toBeInTheDocument()
    expect(screen.getByText('Você tem 3 tentativas')).toBeInTheDocument()
    expect(useAuthFlowStore.getState().resendAvailableAt).toBeGreaterThan(Date.now())
  })
})
