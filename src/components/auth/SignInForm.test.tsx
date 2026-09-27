import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { SignInForm } from './SignInForm'

const pushMock = vi.fn()
const refreshMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

vi.mock('@/actions/authActions', () => ({
  signInAction: vi.fn(),
}))

const { signInAction } = await import('@/actions/authActions')

beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
})

describe('SignInForm', () => {
  test('mostra a mensagem de erro de credencial inválida', async () => {
    vi.mocked(signInAction).mockResolvedValue({
      success: false,
      error: 'E-mail ou senha incorretos.',
    })
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  test('mostra a mensagem de bloqueio depois de muitas tentativas', async () => {
    vi.mocked(signInAction).mockResolvedValue({
      success: false,
      error: 'Muitas tentativas. Tente novamente em 5 min.',
    })
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(
        screen.getByText(/Muitas tentativas\. Tente novamente em \d+ min\./),
      ).toBeInTheDocument()
    })
    // o form entra em estado bloqueado e desabilita os campos
    expect(screen.getByLabelText('E-mail')).toBeDisabled()
  })

  test('redireciona pra verificação quando o e-mail não está confirmado', async () => {
    vi.mocked(signInAction).mockResolvedValue({
      success: true,
      data: { status: 'needsVerification' },
    })
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha1234')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.stringContaining('/cadastro/verificar'),
      )
    })
  })
})
