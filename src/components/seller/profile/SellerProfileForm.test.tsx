import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { SellerProfileForm, type SellerProfileFormValues } from './SellerProfileForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

const actions = vi.hoisted(() => ({ updateSellerProfileAction: vi.fn() }))
vi.mock('@/actions/sellerActions', () => actions)
vi.mock('@/actions/userActions', () => ({
  requestAvatarUploadAction: vi.fn(),
  confirmAvatarAction: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function profile(
  overrides: Partial<SellerProfileFormValues> = {},
): SellerProfileFormValues {
  return {
    displayName: 'Tiago Ramos',
    bio: '',
    city: '',
    devices: [],
    instagram: '',
    youtube: '',
    tiktok: '',
    spotifyUrl: '',
    isFounder: true,
    imageUrl: null,
    ...overrides,
  }
}

const PREVIEW = 'Prévia: como aparece na página do produto'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SellerProfileForm', () => {
  test('prévia acompanha o nome e os equipamentos', async () => {
    renderWithIntl(
      <SellerProfileForm
        initial={profile({ displayName: 'Tiago Ramos', devices: ['Line 6'] })}
      />,
    )
    await userEvent.clear(screen.getByLabelText('Nome de vendedor'))
    await userEvent.type(screen.getByLabelText('Nome de vendedor'), 'Tiago R.')
    await userEvent.click(screen.getByRole('button', { name: 'Kemper' }))
    const preview = screen.getByRole('region', { name: PREVIEW })
    expect(within(preview).getByText('Tiago R.')).toBeInTheDocument()
    expect(within(preview).getByText(/Line 6 e Kemper/)).toBeInTheDocument()
  })

  test('a prévia fica acima do formulário', () => {
    renderWithIntl(<SellerProfileForm initial={profile()} />)
    const preview = screen.getByRole('region', { name: PREVIEW })
    const heading = screen.getByRole('heading', { name: 'Quem é você' })
    expect(
      preview.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  test('chips de equipamento usam aria-pressed', async () => {
    renderWithIntl(<SellerProfileForm initial={profile({ devices: ['Boss'] })} />)
    const boss = screen.getByRole('button', { name: 'Boss' })
    expect(boss).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(boss)
    expect(boss).toHaveAttribute('aria-pressed', 'false')
  })

  test('mostra só os ícones das redes preenchidas e a marca de fundador', async () => {
    renderWithIntl(<SellerProfileForm initial={profile({ instagram: 'tiago.tone' })} />)
    const preview = screen.getByRole('region', { name: PREVIEW })
    expect(preview.querySelectorAll('[data-social]')).toHaveLength(1)
    await userEvent.type(screen.getByLabelText('TikTok'), 'tiago_tone')
    expect(preview.querySelectorAll('[data-social]')).toHaveLength(2)
    expect(within(preview).getByText(/Vendedor fundador/)).toBeInTheDocument()
  })

  test('contador da bio e botão de mudar foto', async () => {
    renderWithIntl(<SellerProfileForm initial={profile({ bio: 'abc' })} />)
    expect(screen.getByText(/3 de 400 caracteres/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Sobre você'), 'de')
    expect(screen.getByText(/5 de 400 caracteres/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mudar foto' })).toBeInTheDocument()
  })

  test('salva e avisa com role=status', async () => {
    actions.updateSellerProfileAction.mockResolvedValue({ success: true, data: null })
    renderWithIntl(<SellerProfileForm initial={profile({ devices: ['Boss'] })} />)
    await userEvent.type(screen.getByLabelText('Instagram'), '@tiago.tone')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Alterações salvas'),
    )
    expect(actions.updateSellerProfileAction).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Tiago Ramos',
        devices: ['Boss'],
        instagram: 'tiago.tone',
      }),
    )
  })

  test('erro de validação aparece no campo e não chama a action', async () => {
    renderWithIntl(<SellerProfileForm initial={profile()} />)
    await userEvent.type(screen.getByLabelText('Spotify'), 'https://evil.com/x')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Spotify/)
    expect(actions.updateSellerProfileAction).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test('falha da action mostra a mensagem e não marca como salvo', async () => {
    actions.updateSellerProfileAction.mockResolvedValue({
      success: false,
      error: 'Não foi possível completar a ação.',
    })
    renderWithIntl(<SellerProfileForm initial={profile()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(
      await screen.findByText('Não foi possível completar a ação.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
