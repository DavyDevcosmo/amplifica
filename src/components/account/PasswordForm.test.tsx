import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { PasswordForm } from './PasswordForm'

const refreshMock = vi.fn()
const toastSuccess = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

vi.mock('sonner', () => ({ toast: { success: (m: string) => toastSuccess(m) } }))

vi.mock('@/actions/userActions', () => ({
  changePasswordAction: vi.fn(),
  setPasswordAction: vi.fn(),
}))

const { changePasswordAction, setPasswordAction } = await import(
  '@/actions/userActions'
)

beforeEach(() => {
  vi.clearAllMocks()
})

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: { current?: string; next: string; confirm: string },
) {
  if (values.current !== undefined) {
    await user.type(screen.getByLabelText('Senha atual'), values.current)
  }
  await user.type(screen.getByLabelText('Nova senha'), values.next)
  await user.type(screen.getByLabelText('Confirmar nova senha'), values.confirm)
}

describe('PasswordForm (trocar senha)', () => {
  test('exige a senha atual', () => {
    renderWithIntl(<PasswordForm hasPassword />)
    expect(screen.getByLabelText('Senha atual')).toBeInTheDocument()
  })

  test('confirmação diferente: erro no campo e a action não roda', async () => {
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword />)
    await fill(user, {
      current: 'senhaAtual1',
      next: 'senhaNova123',
      confirm: 'outra123',
    })
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(changePasswordAction).not.toHaveBeenCalled()
  })

  test('nova senha igual à atual: erro no campo da nova senha', async () => {
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword />)
    await fill(user, {
      current: 'senhaIgual1',
      next: 'senhaIgual1',
      confirm: 'senhaIgual1',
    })
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(
      await screen.findByText('A nova senha precisa ser diferente da atual.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('aria-invalid', 'true')
    expect(changePasswordAction).not.toHaveBeenCalled()
  })

  test('senha atual incorreta: mensagem inline no campo "Senha atual"', async () => {
    vi.mocked(changePasswordAction).mockResolvedValue({
      success: false,
      error: 'Senha atual incorreta.',
      code: 'INVALID_PASSWORD',
    })
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword />)
    await fill(user, {
      current: 'errada123',
      next: 'senhaNova123',
      confirm: 'senhaNova123',
    })
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  test('sucesso: manda só senha atual e nova, avisa e limpa os campos', async () => {
    vi.mocked(changePasswordAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword />)
    await fill(user, {
      current: 'senhaAtual1',
      next: 'senhaNova123',
      confirm: 'senhaNova123',
    })
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))

    expect(changePasswordAction).toHaveBeenCalledWith({
      currentPassword: 'senhaAtual1',
      newPassword: 'senhaNova123',
    })
    await vi.waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Senha alterada'))
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
  })

  test('o botão de mostrar/ocultar revela a senha digitada', async () => {
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword />)
    const field = screen.getByLabelText('Nova senha')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(screen.getAllByRole('button', { name: 'Mostrar senha' })[1])
    expect(field).toHaveAttribute('type', 'text')
  })
})

describe('PasswordForm (definir senha, conta só com Google)', () => {
  test('não pede a senha atual e chama setPasswordAction', async () => {
    vi.mocked(setPasswordAction).mockResolvedValue({ success: true, data: null })
    const user = userEvent.setup()
    renderWithIntl(<PasswordForm hasPassword={false} />)
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()

    await fill(user, { next: 'senhaNova123', confirm: 'senhaNova123' })
    await user.click(screen.getByRole('button', { name: 'Definir senha' }))

    expect(setPasswordAction).toHaveBeenCalledWith({ newPassword: 'senhaNova123' })
    expect(changePasswordAction).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled())
  })
})
