import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { renderWithIntl } from '@/test/renderWithIntl'
import { VerifyEmailForm } from './VerifyEmailForm'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

vi.mock('@/actions/authActions', () => ({
  verifyEmailAction: vi.fn(),
  resendCodeAction: vi.fn(),
}))

const { verifyEmailAction, resendCodeAction } = await import('@/actions/authActions')

beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
  useAuthFlowStore.setState({ pendingEmail: 'user@example.com' })
})

describe('VerifyEmailForm', () => {
  test('só aceita 6 dígitos antes de chamar a action', async () => {
    const user = userEvent.setup()
    renderWithIntl(<VerifyEmailForm />)

    const otpInput = document.querySelector('input[autocomplete="one-time-code"]')
    expect(otpInput).toBeTruthy()

    await user.type(otpInput as HTMLElement, '123')
    await user.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))

    expect(await screen.findByText('O código tem 6 dígitos')).toBeInTheDocument()
    expect(verifyEmailAction).not.toHaveBeenCalled()
  })

  test('chama a action quando os 6 dígitos são preenchidos', async () => {
    vi.mocked(verifyEmailAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<VerifyEmailForm />)

    const otpInput = document.querySelector(
      'input[autocomplete="one-time-code"]',
    ) as HTMLElement
    await user.type(otpInput, '123456')
    await user.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))

    await waitFor(() => {
      expect(verifyEmailAction).toHaveBeenCalledWith(
        { email: 'user@example.com', otp: '123456' },
        undefined,
      )
    })
  })

  test('desabilita o reenvio durante os 60s de cooldown', async () => {
    vi.useFakeTimers()
    useAuthFlowStore.setState({ resendAvailableAt: Date.now() + 60_000 })
    renderWithIntl(<VerifyEmailForm />)

    expect(screen.getByText(/Reenviar código em \d+:\d{2}/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reenviar código' }),
    ).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(61_000)

    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  describe('estado de erro do código', () => {
    // mensagens reais que a action devolve (ver lib/authErrors.ts)
    async function submitCode(code: string) {
      const user = userEvent.setup()
      const view = renderWithIntl(<VerifyEmailForm />)
      const otpInput = document.querySelector(
        'input[autocomplete="one-time-code"]',
      ) as HTMLElement
      await user.type(otpInput, code)
      await user.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))
      return { user, otpInput, view }
    }

    test('código incorreto: mostra o aviso e some ao editar os dígitos', async () => {
      vi.mocked(verifyEmailAction).mockResolvedValue({
        success: false,
        error: 'Código inválido.',
        code: 'INVALID_OTP',
      })
      const { user, otpInput } = await submitCode('111111')

      expect(
        await screen.findByText(
          'Código incorreto. Confira os dígitos e tente de novo.',
        ),
      ).toBeInTheDocument()
      expect(otpInput).toHaveAttribute('aria-invalid', 'true')

      // o input-otp posiciona o cursor de forma assíncrona após o foco; sob
      // carga o primeiro Backspace pode chegar antes e não apagar nada — então
      // repete até o aviso sumir.
      await user.click(otpInput)
      await waitFor(async () => {
        await user.keyboard('{Backspace}')
        expect(
          screen.queryByText('Código incorreto. Confira os dígitos e tente de novo.'),
        ).not.toBeInTheDocument()
        expect(otpInput).not.toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('código expirado: libera o reenvio mesmo dentro do cooldown de 60s', async () => {
      useAuthFlowStore.setState({ resendAvailableAt: Date.now() + 60_000 })
      vi.mocked(verifyEmailAction).mockResolvedValue({
        success: false,
        error: 'Código expirado. Peça um novo.',
        code: 'OTP_EXPIRED',
      })
      renderWithIntl(<VerifyEmailForm />)
      expect(screen.getByText(/Reenviar código em \d+:\d{2}/)).toBeInTheDocument()

      const user = userEvent.setup()
      const otpInput = document.querySelector(
        'input[autocomplete="one-time-code"]',
      ) as HTMLElement
      await user.type(otpInput, '123456')
      await user.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))

      expect(
        await screen.findByText(
          'Esse código expirou. Peça um novo código para continuar.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
      expect(screen.queryByText(/Reenviar código em/)).not.toBeInTheDocument()
    })

    test('limite de tentativas (servidor): bloqueia o envio e libera um código novo', async () => {
      useAuthFlowStore.setState({ resendAvailableAt: Date.now() + 60_000 })
      vi.mocked(verifyEmailAction).mockResolvedValue({
        success: false,
        error: 'Muitas tentativas. Aguarde antes de tentar de novo.',
        code: 'TOO_MANY_ATTEMPTS',
      })
      await submitCode('123456')

      expect(
        await screen.findByText(
          'Você atingiu o limite de tentativas. Peça um novo código para continuar.',
        ),
      ).toBeInTheDocument()
      expect(
        await screen.findByRole('button', { name: 'Confirmar e-mail' }),
      ).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
    })

    test('erro sem code conhecido: mostra o texto da action, sem reescrita', async () => {
      vi.mocked(verifyEmailAction).mockResolvedValue({
        success: false,
        error: 'Cadastro expirou. Cadastre-se novamente.',
      })
      await submitCode('123456')

      expect(
        await screen.findByText('Cadastro expirou. Cadastre-se novamente.'),
      ).toBeInTheDocument()
    })
  })

  describe('prazo e tentativas do código', () => {
    const WRONG_CODE = {
      success: false,
      error: 'Código inválido.',
      code: 'INVALID_OTP',
    } as const

    async function typeAndSubmit(
      user: ReturnType<typeof userEvent.setup>,
      code: string,
    ) {
      const otpInput = document.querySelector(
        'input[autocomplete="one-time-code"]',
      ) as HTMLElement
      await user.click(otpInput)
      await user.keyboard(code)
      await user.click(screen.getByRole('button', { name: 'Confirmar e-mail' }))
    }

    test('mostra as 3 tentativas e o prazo de 5 minutos quando o código é enviado', () => {
      useAuthFlowStore.getState().startOtpWindow()
      renderWithIntl(<VerifyEmailForm />)

      expect(screen.getByText('Você tem 3 tentativas')).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent(
        /O código expira em (4:5d|5:00)/,
      )
    })

    test('cada código errado desconta uma tentativa e mostra quantas restam', async () => {
      useAuthFlowStore.getState().startOtpWindow()
      vi.mocked(verifyEmailAction).mockResolvedValue(WRONG_CODE)
      const user = userEvent.setup()
      renderWithIntl(<VerifyEmailForm />)

      await typeAndSubmit(user, '111111')
      expect(await screen.findByText('Você tem mais 2 tentativas')).toBeInTheDocument()
      expect(useAuthFlowStore.getState().otpAttemptsLeft).toBe(2)
    })

    test('singular: "mais 1 tentativa"', () => {
      useAuthFlowStore.getState().startOtpWindow()
      useAuthFlowStore.setState({ otpAttemptsLeft: 1 })
      renderWithIntl(<VerifyEmailForm />)

      expect(screen.getByText('Você tem mais 1 tentativa')).toBeInTheDocument()
    })

    test('errou a última tentativa: bloqueia o envio e pede um código novo, sem esperar o cooldown', async () => {
      useAuthFlowStore.getState().startOtpWindow()
      useAuthFlowStore.setState({
        otpAttemptsLeft: 1,
        resendAvailableAt: Date.now() + 60_000,
      })
      vi.mocked(verifyEmailAction).mockResolvedValue(WRONG_CODE)
      const user = userEvent.setup()
      renderWithIntl(<VerifyEmailForm />)

      await typeAndSubmit(user, '111111')

      expect(
        await screen.findByText(
          'Você atingiu o limite de tentativas. Peça um novo código para continuar.',
        ),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Você tem mais/)).not.toBeInTheDocument()
      expect(
        await screen.findByRole('button', { name: 'Confirmar e-mail' }),
      ).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
    })

    test('o prazo corre na tela e, ao vencer, bloqueia o envio e libera o reenvio', async () => {
      vi.useFakeTimers()
      useAuthFlowStore.getState().startOtpWindow()
      useAuthFlowStore.setState({ resendAvailableAt: Date.now() + 60_000 })
      renderWithIntl(<VerifyEmailForm />)
      expect(screen.getByRole('timer')).toHaveTextContent('O código expira em 5:00')

      await vi.advanceTimersByTimeAsync(10_000)
      expect(screen.getByRole('timer')).toHaveTextContent('O código expira em 4:50')

      await vi.advanceTimersByTimeAsync(291_000)
      expect(
        screen.getByText('Esse código expirou. Peça um novo código para continuar.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('timer')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirmar e-mail' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
      vi.useRealTimers()
    })

    test('reenviar abre uma janela nova: 3 tentativas e 5 minutos de novo', async () => {
      useAuthFlowStore.getState().startOtpWindow()
      useAuthFlowStore.setState({ otpAttemptsLeft: 0, resendAvailableAt: null })
      vi.mocked(resendCodeAction).mockResolvedValue({ success: true, data: null })
      const user = userEvent.setup()
      renderWithIntl(<VerifyEmailForm />)

      await user.click(screen.getByRole('button', { name: 'Reenviar código' }))

      expect(await screen.findByText('Você tem 3 tentativas')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirmar e-mail' })).toBeEnabled()
    })
  })

  test('fromLogin: avisa que a conta ainda não foi verificada', () => {
    renderWithIntl(<VerifyEmailForm fromLogin />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua conta ainda não foi verificada.',
    )
    expect(screen.getByText('Reenviamos o código automaticamente.')).toBeInTheDocument()
  })

  test('sem fromLogin: não mostra o aviso de conta não verificada', () => {
    renderWithIntl(<VerifyEmailForm />)

    expect(
      screen.queryByText('Sua conta ainda não foi verificada.'),
    ).not.toBeInTheDocument()
  })

  test('reenvia o código quando o cooldown termina', async () => {
    vi.mocked(resendCodeAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<VerifyEmailForm />)

    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))

    await waitFor(() => {
      expect(resendCodeAction).toHaveBeenCalledWith({ email: 'user@example.com' })
    })
    expect(await screen.findByText('Código reenviado.')).toBeInTheDocument()
  })
})
