import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ProfileForm } from './ProfileForm'

const refreshMock = vi.fn()
const toastSuccess = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

vi.mock('sonner', () => ({ toast: { success: (m: string) => toastSuccess(m) } }))

vi.mock('@/actions/userActions', () => ({
  updateProfileAction: vi.fn(),
}))

const { updateProfileAction } = await import('@/actions/userActions')

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  const user = userEvent.setup()
  renderWithIntl(<ProfileForm name="Maria Souza" email="maria@email.com" />)
  return { user, input: screen.getByLabelText('Nome completo') }
}

describe('ProfileForm', () => {
  test('o botão fica desabilitado até o nome mudar', async () => {
    const { user, input } = setup()
    const button = screen.getByRole('button', { name: 'Salvar alterações' })
    expect(button).toBeDisabled()

    await user.type(input, ' Lima')
    expect(button).toBeEnabled()

    await user.clear(input)
    await user.type(input, 'Maria Souza')
    expect(button).toBeDisabled()
  })

  test('e-mail fica desabilitado e sem dica', () => {
    setup()
    expect(screen.getByLabelText('E-mail')).toBeDisabled()
    expect(
      screen.queryByText('Não é possível alterar o e-mail por enquanto'),
    ).not.toBeInTheDocument()
  })

  test('nome de uma palavra mostra erro no campo e não chama a action', async () => {
    const { user, input } = setup()
    await user.clear(input)
    await user.type(input, 'Maria')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(
      await screen.findByText('Digite nome e sobrenome (pelo menos 2 palavras).'),
    ).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveValue('Maria')
    expect(updateProfileAction).not.toHaveBeenCalled()
  })

  test('sucesso: chama a action, avisa e atualiza a página', async () => {
    vi.mocked(updateProfileAction).mockResolvedValue({ success: true, data: null })
    const { user, input } = setup()
    await user.type(input, ' Lima')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(updateProfileAction).toHaveBeenCalledWith({ name: 'Maria Souza Lima' })
    await vi.waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Perfil atualizado'),
    )
    expect(refreshMock).toHaveBeenCalled()
  })

  test('erro do servidor aparece no campo e mantém o que foi digitado', async () => {
    vi.mocked(updateProfileAction).mockResolvedValue({
      success: false,
      error: 'Não foi possível completar a ação. Tente novamente.',
    })
    const { user, input } = setup()
    await user.type(input, ' Lima')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(
      await screen.findByText('Não foi possível completar a ação. Tente novamente.'),
    ).toBeInTheDocument()
    expect(input).toHaveValue('Maria Souza Lima')
    expect(toastSuccess).not.toHaveBeenCalled()
  })
})
