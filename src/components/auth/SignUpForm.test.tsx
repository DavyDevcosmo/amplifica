import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { SignUpForm } from './SignUpForm'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/actions/authActions', () => ({
  signUpAction: vi.fn(),
}))

const { signUpAction } = await import('@/actions/authActions')

beforeEach(() => {
  vi.clearAllMocks()
  useAuthFlowStore.getState().reset()
})

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<
    Record<'name' | 'email' | 'password' | 'confirmPassword', string>
  > = {},
) {
  await user.type(screen.getByLabelText('Nome'), overrides.name ?? 'Guitarrista')
  await user.type(
    screen.getByLabelText('E-mail'),
    overrides.email ?? 'user@example.com',
  )
  await user.type(screen.getByLabelText('Senha'), overrides.password ?? 'senha1234')
  await user.type(
    screen.getByLabelText('Confirmar senha'),
    overrides.confirmPassword ?? 'senha1234',
  )
}

describe('SignUpForm', () => {
  test('mostra erro quando as senhas são diferentes e não chama a action', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    await fillForm(user, { confirmPassword: 'outraSenha123' })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(signUpAction).not.toHaveBeenCalled()
  })

  test('envia a action e avança pra verificação quando os dados são válidos', async () => {
    vi.mocked(signUpAction).mockResolvedValue({
      success: true,
      data: { email: 'user@example.com' },
    })
    const user = userEvent.setup()
    render(<SignUpForm />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(signUpAction).toHaveBeenCalledWith({
        name: 'Guitarrista',
        email: 'user@example.com',
        password: 'senha1234',
        confirmPassword: 'senha1234',
      })
      expect(pushMock).toHaveBeenCalledWith('/cadastro/verificar')
    })
    expect(useAuthFlowStore.getState().pendingEmail).toBe('user@example.com')
  })
})
