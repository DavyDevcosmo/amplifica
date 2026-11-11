import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { ProductEditData } from '@/server/queries/productQueries'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ProductWizard } from './ProductWizard'

const push = vi.fn()
const replace = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, refresh }),
}))

const actions = vi.hoisted(() => ({
  createProductDraftAction: vi.fn(),
  saveProductDraftAction: vi.fn(),
  submitProductAction: vi.fn(),
  requestProductUploadAction: vi.fn(),
  confirmProductUploadAction: vi.fn(),
  removeProductFileAction: vi.fn(),
}))
vi.mock('@/actions/productActions', () => actions)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

function editData(overrides: Partial<ProductEditData> = {}): ProductEditData {
  return {
    productId: 'p1',
    status: 'draft',
    draft: {
      kinds: ['PRESET', 'IR'],
      title: 'Plexi 68 — Helix',
      shortDescription: 'Plexi com a cadeia completa de palco.',
      about: 'Gravado ao vivo.',
      includes: ['8 presets'],
      styles: ['Rock clássico'],
      priceCents: 6792,
      free: false,
    },
    files: [
      {
        id: 'f1',
        kind: 'DELIVERABLE',
        fileName: 'plexi68.hlx',
        sizeBytes: 48 * 1024,
        url: null,
      },
    ],
    founderRemainingSales: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  actions.createProductDraftAction.mockResolvedValue({
    success: true,
    data: { productId: 'new1' },
  })
  actions.saveProductDraftAction.mockResolvedValue({ success: true, data: null })
  actions.submitProductAction.mockResolvedValue({ success: true, data: null })
})

describe('ProductWizard', () => {
  test('Enviar fica desabilitado sem arquivo do pack e lista o que falta', () => {
    renderWithIntl(<ProductWizard initial={editData({ files: [] })} step={5} />)
    expect(screen.getByRole('button', { name: 'Enviar para análise' })).toBeDisabled()
    expect(
      screen.getByText('Para enviar falta: arquivos do pack enviados.'),
    ).toBeInTheDocument()
  })

  test('produto em análise abre só leitura', () => {
    renderWithIntl(<ProductWizard initial={editData({ status: 'review' })} step={1} />)
    expect(screen.getByLabelText('Nome do produto')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).toBeNull()
    expect(
      screen.getByText('Em análise. Você poderá editar quando a análise terminar.'),
    ).toBeInTheDocument()
  })

  test('produto novo: Continuar cria o rascunho sem itens em branco e vai para a etapa 2', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={null} step={1} />)
    await user.click(screen.getByRole('button', { name: /^Preset/ }))
    await user.type(screen.getByLabelText('Nome do produto'), 'Plexi 68')
    await user.type(screen.getByLabelText('Novo item do pack'), '   ')
    await user.click(screen.getByRole('button', { name: 'Adicionar item' }))
    await user.type(screen.getByLabelText('Novo item do pack'), '8 presets')
    await user.click(screen.getByRole('button', { name: 'Adicionar item' }))
    expect(
      screen.getByRole('button', { name: 'Remover 8 presets' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/seller/products/new1/edit?etapa=2'),
    )
    expect(actions.createProductDraftAction).toHaveBeenCalledTimes(1)
    const input = actions.createProductDraftAction.mock.calls[0]?.[0]
    expect(input).toMatchObject({
      kinds: ['PRESET'],
      title: 'Plexi 68',
      includes: ['8 presets'],
    })
  })

  test('a descrição curta mostra a contagem de caracteres', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={null} step={1} />)
    await user.type(screen.getByLabelText('Descrição curta'), 'Plexi')
    expect(screen.getByText('5 de 120 caracteres')).toBeInTheDocument()
  })

  test('Outro mostra o campo "O que mais vem no pack?"', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={null} step={1} />)
    expect(screen.queryByLabelText('O que mais vem no pack?')).toBeNull()
    const other = screen.getByRole('button', { name: /^Outro/ })
    await user.click(other)
    expect(other).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('O que mais vem no pack?')).toBeInTheDocument()
  })

  test('produto existente: Salvar rascunho salva e avisa', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Rascunho salvo'))
    expect(actions.saveProductDraftAction).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ title: 'Plexi 68 — Helix' }),
    )
    expect(actions.createProductDraftAction).not.toHaveBeenCalled()
  })

  test('Continuar com produto existente salva e empurra a próxima etapa', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('?etapa=3'))
    expect(actions.saveProductDraftAction).toHaveBeenCalledTimes(1)
  })

  test('Voltar não salva', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(push).toHaveBeenCalledWith('?etapa=1')
    expect(actions.saveProductDraftAction).not.toHaveBeenCalled()
  })

  test('erro da action vira toast.error e não navega', async () => {
    actions.saveProductDraftAction.mockResolvedValue({
      success: false,
      error: 'Produto não encontrado.',
    })
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Produto não encontrado.', undefined),
    )
    expect(push).not.toHaveBeenCalled()
  })

  test('clique numa etapa do stepper salva e navega', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={1} />)
    const nav = screen.getAllByRole('navigation', { name: 'Etapas do cadastro' })[0]
    await user.click(within(nav as HTMLElement).getByRole('button', { name: /Preço/ }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('?etapa=4'))
    expect(actions.saveProductDraftAction).toHaveBeenCalledTimes(1)
  })

  test('stepper marca etapa anterior incompleta com "Falta algo"', () => {
    renderWithIntl(
      <ProductWizard
        initial={editData({ draft: { kinds: [], title: '', priceCents: 6792 } })}
        step={3}
      />,
    )
    expect(screen.getByText('Falta algo')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getAllByText('Etapa 3 de 5').length).toBeGreaterThan(0)
  })

  test('estilos travam em 3 e o "Outro" pede "Qual estilo?"', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    expect(screen.getByText('1 de 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Blues' }))
    await user.click(screen.getByRole('button', { name: 'Outro' }))
    expect(screen.getByText('3 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jazz' })).toBeDisabled()
    expect(screen.getByLabelText('Qual estilo?')).toBeInTheDocument()
  })

  test('detalhes da captura só aparecem com Capture marcado', () => {
    const { unmount } = renderWithIntl(<ProductWizard initial={editData()} step={2} />)
    expect(screen.queryByText('Detalhes da captura')).toBeNull()
    unmount()
    renderWithIntl(
      <ProductWizard
        initial={editData({
          draft: { ...editData().draft, kinds: ['CAPTURE'], captureKind: 'OTHER' },
        })}
        step={2}
      />,
    )
    expect(screen.getByText('Detalhes da captura')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Outro' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByLabelText('O que foi capturado?')).toBeInTheDocument()
  })

  test('arquivos do pack listam nome e tamanho', () => {
    renderWithIntl(<ProductWizard initial={editData()} step={3} />)
    expect(screen.getByText('plexi68.hlx')).toBeInTheDocument()
    expect(screen.getByText('48 KB')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remover plexi68.hlx' }),
    ).toBeInTheDocument()
  })

  test('sem R2 avisa e desabilita o envio de arquivos', () => {
    renderWithIntl(
      <ProductWizard initial={editData()} step={3} uploadsEnabled={false} />,
    )
    expect(
      screen.getByText('O envio de arquivos está indisponível no momento.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar arquivos/ })).toBeDisabled()
  })

  test('revisão resume o produto e lista sugestões novas', () => {
    renderWithIntl(
      <ProductWizard
        initial={editData({
          draft: {
            ...editData().draft,
            kinds: ['PRESET', 'OTHER'],
            kindOther: 'Patch MIDI',
            styleOther: 'Shoegaze',
          },
        })}
        step={5}
      />,
    )
    const review = within(
      screen.getByRole('region', { name: 'Revise antes de enviar' }),
    )
    expect(review.getByText('Preset + Patch MIDI')).toBeInTheDocument()
    expect(review.getByText('Rock clássico, Shoegaze')).toBeInTheDocument()
    expect(review.getByText('1 arquivo do pack · sem prévia')).toBeInTheDocument()
    expect(
      review.getByText(/R\$\s67,92 \(você recebe R\$\s54,63\)/),
    ).toBeInTheDocument()
    expect(review.getByRole('button', { name: 'Editar Preço' })).toBeInTheDocument()
    expect(
      screen.getByText(/Você sugeriu itens novos: Patch MIDI, Shoegaze\./),
    ).toBeInTheDocument()
  })

  test('Enviar para análise envia e volta para a lista em análise', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={5} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para análise' }))
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/seller/products?situacao=review'),
    )
    expect(actions.submitProductAction).toHaveBeenCalledWith('p1')
    expect(toast.success).toHaveBeenCalledWith('Enviado para análise')
  })

  test('envio recusado por falta de item lista o que falta', async () => {
    actions.submitProductAction.mockResolvedValue({
      success: false,
      error: 'Complete o produto antes de enviar para análise.',
      code: 'PRODUCT_INCOMPLETE',
      params: { missing: 'files,price' },
    })
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={5} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para análise' }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Complete o produto antes de enviar para análise.',
        {
          description:
            'Para enviar falta: arquivos do pack enviados, preço a partir de R$ 10,00.',
        },
      ),
    )
    expect(push).not.toHaveBeenCalled()
  })

  test('produto novo: segundo clique antes de /edit chegar não cria outro rascunho', async () => {
    let resolveCreate: (value: unknown) => void = () => {}
    actions.createProductDraftAction.mockImplementation(
      () => new Promise((resolve) => (resolveCreate = resolve)),
    )
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={null} step={1} />)
    const next = screen.getByRole('button', { name: 'Continuar' })
    // duplo clique enquanto o create está pendente
    await user.click(next)
    await user.click(next)
    resolveCreate({ success: true, data: { productId: 'new1' } })
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/seller/products/new1/edit?etapa=2'),
    )
    // `replace` mockado não desmonta: a página /new continua interativa
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeEnabled(),
    )
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Rascunho salvo'))
    expect(actions.createProductDraftAction).toHaveBeenCalledTimes(1)
    expect(actions.saveProductDraftAction).toHaveBeenCalledWith(
      'new1',
      expect.any(Object),
    )
  })

  test('depois de enviar, um segundo clique não salva nem envia de novo', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={5} />)
    const submit = screen.getByRole('button', { name: 'Enviar para análise' })
    await user.click(submit)
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/seller/products?situacao=review'),
    )
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(actions.submitProductAction).toHaveBeenCalledTimes(1)
    expect(actions.saveProductDraftAction).toHaveBeenCalledTimes(1)
  })

  test('action que lança no upload avisa e libera o botão de novo', async () => {
    actions.requestProductUploadAction.mockRejectedValue(new Error('network'))
    const user = userEvent.setup()
    const { container } = renderWithIntl(
      <ProductWizard initial={editData()} step={3} />,
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'novo.hlx', { type: '' }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível enviar o arquivo. Tente de novo.',
        { description: 'novo.hlx' },
      ),
    )
    expect(actions.requestProductUploadAction).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'application/octet-stream' }),
    )
    expect(screen.getByRole('button', { name: /Enviar arquivos/ })).toBeEnabled()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })

  test('action que lança ao remover avisa e libera os botões', async () => {
    actions.removeProductFileAction.mockRejectedValue(new Error('500'))
    const user = userEvent.setup()
    renderWithIntl(<ProductWizard initial={editData()} step={3} />)
    const remove = screen.getByRole('button', { name: 'Remover plexi68.hlx' })
    await user.click(remove)
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível completar a ação. Tente novamente.',
      ),
    )
    expect(remove).toBeEnabled()
    expect(screen.getByRole('button', { name: /Enviar arquivos/ })).toBeEnabled()
  })
})
