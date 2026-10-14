import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthFlowStore } from '@/stores/authFlowStore'
import { renderWithIntl } from '@/test/renderWithIntl'
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
  await user.type(
    screen.getByLabelText('Nome completo'),
    overrides.name ?? 'Guitarrista Teste',
  )
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
    renderWithIntl(<SignUpForm />)

    await fillForm(user, { confirmPassword: 'outraSenha123' })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(signUpAction).not.toHaveBeenCalled()
  })

  test('mostra "Nome muito curto" embaixo do campo de nome e não chama a action', async () => {
    const user = userEvent.setup()
    renderWithIntl(<SignUpForm />)

    await fillForm(user, { name: 'A' })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const nameError = await screen.findByText('Nome muito curto')
    expect(nameError).toBeInTheDocument()

    const nameField = screen
      .getByLabelText('Nome completo')
      .closest('[data-slot="field"]')
    const emailField = screen.getByLabelText('E-mail').closest('[data-slot="field"]')
    const passwordField = screen.getByLabelText('Senha').closest('[data-slot="field"]')

    expect(nameField).toContainElement(nameError)
    expect(emailField).not.toContainElement(nameError)
    expect(passwordField).not.toContainElement(nameError)
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(signUpAction).not.toHaveBeenCalled()
  })

  test('envia a action e avança pra verificação quando os dados são válidos', async () => {
    vi.mocked(signUpAction).mockResolvedValue({
      success: true,
      data: { email: 'user@example.com' },
    })
    const user = userEvent.setup()
    renderWithIntl(<SignUpForm />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(signUpAction).toHaveBeenCalledWith({
        name: 'Guitarrista Teste',
        email: 'user@example.com',
        password: 'senha1234',
      })
      expect(pushMock).toHaveBeenCalledWith('/signup/verify')
    })
    expect(useAuthFlowStore.getState().pendingEmail).toBe('user@example.com')
  })
})
