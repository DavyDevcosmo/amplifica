import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
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
    render(<VerifyEmailForm />)

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
    render(<VerifyEmailForm />)

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
    render(<VerifyEmailForm />)

    expect(screen.getByText(/Reenviar código em \d+s/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reenviar código' }),
    ).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(61_000)

    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  test('reenvia o código quando o cooldown termina', async () => {
    vi.mocked(resendCodeAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    render(<VerifyEmailForm />)

    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))

    await waitFor(() => {
      expect(resendCodeAction).toHaveBeenCalledWith({ email: 'user@example.com' })
    })
    expect(await screen.findByText('Código reenviado.')).toBeInTheDocument()
  })
})
