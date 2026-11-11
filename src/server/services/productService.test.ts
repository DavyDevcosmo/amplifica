import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { RevisionDraftSource } from './productService'

const product = {
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}
const productRevision = {
  create: vi.fn(),
  updateMany: vi.fn(),
}
const db = {
  product,
  productRevision,
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
}

vi.mock('@/lib/prisma', () => ({ prisma: db }))

const {
  ProductIncompleteError,
  ProductLockedError,
  ProductNotFoundError,
  buildProductSlug,
  createProductDraft,
  draftToRevisionData,
  ensureWorkingRevision,
  planDraftSave,
  planSubmit,
  revisionToDraft,
  saveProductDraft,
  submitProductForReview,
} = await import('./productService')

const validInput = {
  kinds: ['PRESET' as const],
  title: 'Plexi 68',
  shortDescription: 'Plexi completo em snapshots',
  about: 'Tudo sobre o Plexi',
  priceCents: 2990,
}

function revisionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    version: 1,
    status: 'DRAFT',
    title: 'Plexi 68',
    description: 'Tudo sobre o Plexi',
    shortDescription: 'Plexi completo em snapshots',
    includes: [],
    kinds: ['PRESET'],
    kindOther: null,
    styles: [],
    styleOther: null,
    capturedAmp: null,
    captureKind: null,
    captureKindOther: null,
    youtubeUrl: null,
    priceCents: 2990,
    files: [],
    _count: { files: 1 },
    ...overrides,
  }
}

// linha do banco com os enums como string: só para alimentar o mapeamento
function source(overrides: Record<string, unknown> = {}) {
  return revisionRow(overrides) as unknown as RevisionDraftSource
}

function productRow(
  overrides: Record<string, unknown> = {},
  revision: Record<string, unknown> | null = {},
) {
  return {
    id: 'p1',
    status: 'DRAFT',
    productType: 'PRESET',
    slug: 'plexi-68-abc123',
    publishedAt: null,
    liveRevisionId: null,
    revisions: revision ? [revisionRow(revision)] : [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  product.create.mockResolvedValue({ id: 'p1' })
  productRevision.updateMany.mockResolvedValue({ count: 1 })
})

describe('decisões puras', () => {
  test('planDraftSave: qual revisão recebe a edição', () => {
    expect(planDraftSave({ status: 'DRAFT' })).toBe('update')
    expect(planDraftSave({ status: 'REJECTED' })).toBe('update')
    expect(planDraftSave({ status: 'APPROVED' })).toBe('newVersion')
    expect(planDraftSave(null)).toBe('newVersion')
    expect(planDraftSave({ status: 'PENDING_REVIEW' })).toBe('locked')
  })

  test('planSubmit: só rascunho ou recusada podem ir para análise', () => {
    expect(planSubmit({ status: 'DRAFT' })).toBe(true)
    expect(planSubmit({ status: 'REJECTED' })).toBe(true)
    expect(planSubmit({ status: 'PENDING_REVIEW' })).toBe(false)
    expect(planSubmit({ status: 'APPROVED' })).toBe(false)
    expect(planSubmit(null)).toBe(false)
  })

  test('buildProductSlug cai em "produto" quando o título não gera slug', () => {
    expect(buildProductSlug('Plexi 68 Ação')).toMatch(/^plexi-68-acao-[0-9a-f]{6}$/)
    expect(buildProductSlug('')).toMatch(/^produto-[0-9a-f]{6}$/)
    expect(buildProductSlug('🎸🎸')).toMatch(/^produto-[0-9a-f]{6}$/)
  })

  test('preço: gratuito grava 0, sem preço grava null e volta como 0', () => {
    expect(
      draftToRevisionData({ ...parsed(), free: true, priceCents: 5000 }).priceCents,
    ).toBe(0)
    expect(draftToRevisionData({ ...parsed(), priceCents: 0 }).priceCents).toBeNull()
    expect(draftToRevisionData({ ...parsed(), priceCents: 2990 }).priceCents).toBe(2990)
    expect(revisionToDraft(source({ priceCents: 0 }), 'PRESET')).toMatchObject({
      priceCents: 0,
      free: true,
    })
    expect(revisionToDraft(source({ priceCents: null }), 'PRESET')).toMatchObject({
      priceCents: 0,
      free: false,
    })
  })

  test('revisionToDraft: kinds nulo ou vazio vira [productType]; lixo antigo some', () => {
    expect(revisionToDraft(source({ kinds: null }), 'IR').kinds).toEqual(['IR'])
    expect(revisionToDraft(source({ kinds: [] }), 'CAPTURE').kinds).toEqual(['CAPTURE'])
    expect(revisionToDraft(source({ kinds: [] }), 'BUNDLE').kinds).toEqual([])
    expect(
      revisionToDraft(source({ styles: ['Blues', 'Forró'], includes: null }), 'PRESET'),
    ).toMatchObject({ styles: ['Blues'], includes: [] })
    expect(revisionToDraft(source({ description: 'Sobre' }), 'PRESET').about).toBe(
      'Sobre',
    )
  })
})

function parsed() {
  return {
    kinds: [],
    title: '',
    shortDescription: '',
    about: '',
    includes: [],
    styles: [],
    priceCents: 0,
    free: false,
  } as Parameters<typeof draftToRevisionData>[0]
}

describe('createProductDraft', () => {
  test('cria produto DRAFT de guitarra com revisão v1 DRAFT', async () => {
    await expect(createProductDraft('s1', validInput)).resolves.toEqual({
      productId: 'p1',
    })
    const { data } = product.create.mock.calls[0][0]
    expect(data).toMatchObject({
      sellerId: 's1',
      instrument: 'GUITAR',
      productType: 'PRESET',
      status: 'DRAFT',
      title: 'Plexi 68',
      description: 'Tudo sobre o Plexi',
      priceCents: 2990,
      revisions: { create: expect.objectContaining({ version: 1, status: 'DRAFT' }) },
    })
    expect(data.slug).toMatch(/^plexi-68-[0-9a-f]{6}$/)
  })

  test('sem tipo usa PRESET e sem título usa "produto"', async () => {
    await createProductDraft('s1', {})
    const { data } = product.create.mock.calls[0][0]
    expect(data.productType).toBe('PRESET')
    expect(data.slug).toMatch(/^produto-[0-9a-f]{6}$/)
  })
})

describe('saveProductDraft', () => {
  test('produto de outro vendedor: não encontrado e nada é gravado', async () => {
    product.findFirst.mockResolvedValue(null)
    await expect(saveProductDraft('s2', 'p1', validInput)).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
    expect(product.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'p1',
      sellerId: 's2',
    })
    expect(productRevision.updateMany).not.toHaveBeenCalled()
    expect(productRevision.create).not.toHaveBeenCalled()
    expect(product.update).not.toHaveBeenCalled()
  })

  test('em análise: bloqueado e nada é gravado', async () => {
    product.findFirst.mockResolvedValue(productRow({}, { status: 'PENDING_REVIEW' }))
    await expect(saveProductDraft('s1', 'p1', validInput)).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(productRevision.updateMany).not.toHaveBeenCalled()
    expect(product.update).not.toHaveBeenCalled()
  })

  test('rascunho nunca publicado: grava na revisão e espelha no produto', async () => {
    product.findFirst.mockResolvedValue(productRow())
    await saveProductDraft('s1', 'p1', { ...validInput, title: 'Plexi 69' })
    expect(productRevision.updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', status: { in: ['DRAFT', 'REJECTED'] } },
      data: expect.objectContaining({
        title: 'Plexi 69',
        status: 'DRAFT',
        rejectionReason: null,
      }),
    })
    const { where, data } = product.update.mock.calls[0][0]
    expect(where).toEqual({ id: 'p1' })
    expect(data).toMatchObject({
      title: 'Plexi 69',
      productType: 'PRESET',
      priceCents: 2990,
    })
    expect(data.slug).toMatch(/^plexi-69-[0-9a-f]{6}$/)
  })

  test('mesmo título não troca o slug', async () => {
    product.findFirst.mockResolvedValue(productRow())
    await saveProductDraft('s1', 'p1', validInput)
    expect(product.update.mock.calls[0][0].data.slug).toBeUndefined()
  })

  test('recusada editada volta a rascunho (revisão e produto)', async () => {
    product.findFirst.mockResolvedValue(
      productRow({ status: 'REJECTED' }, { status: 'REJECTED' }),
    )
    await saveProductDraft('s1', 'p1', validInput)
    expect(productRevision.updateMany.mock.calls[0][0].data).toMatchObject({
      status: 'DRAFT',
      rejectionReason: null,
    })
    expect(product.update.mock.calls[0][0].data.status).toBe('DRAFT')
  })

  test('publicado: cria versão +1 com cópia dos arquivos e não toca no produto no ar', async () => {
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED', publishedAt: new Date(), liveRevisionId: 'r1' },
        {
          status: 'APPROVED',
          version: 3,
          files: [
            {
              kind: 'DELIVERABLE',
              r2Key: 'products/p1/DELIVERABLE/a-x.hlx',
              fileName: 'x.hlx',
              contentType: 'application/octet-stream',
              sizeBytes: 10,
            },
          ],
        },
      ),
    )
    await saveProductDraft('s1', 'p1', { ...validInput, title: 'Plexi novo' })
    expect(productRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'p1',
        version: 4,
        status: 'DRAFT',
        title: 'Plexi novo',
        files: {
          create: [
            {
              kind: 'DELIVERABLE',
              r2Key: 'products/p1/DELIVERABLE/a-x.hlx',
              fileName: 'x.hlx',
              contentType: 'application/octet-stream',
              sizeBytes: 10,
            },
          ],
        },
      }),
    })
    expect(productRevision.updateMany).not.toHaveBeenCalled()
    expect(product.update).not.toHaveBeenCalled()
  })

  test('publicado com edição em rascunho: grava na revisão de trabalho, produto intacto', async () => {
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED', publishedAt: new Date(), liveRevisionId: 'r1' },
        { id: 'r2', version: 2, status: 'DRAFT' },
      ),
    )
    await saveProductDraft('s1', 'p1', validInput)
    expect(productRevision.updateMany.mock.calls[0][0].where.id).toBe('r2')
    expect(product.update).not.toHaveBeenCalled()
  })

  test('PUBLISHED sem publishedAt (aprovado à mão): não sobrescreve o produto no ar', async () => {
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED', publishedAt: null, liveRevisionId: 'r1' },
        { status: 'APPROVED' },
      ),
    )
    await saveProductDraft('s1', 'p1', { ...validInput, title: 'Plexi novo' })
    expect(productRevision.create).toHaveBeenCalled()
    expect(product.update).not.toHaveBeenCalled()
  })

  test('corrida com o envio (revisão mudou de status no meio): bloqueado', async () => {
    product.findFirst.mockResolvedValue(productRow())
    productRevision.updateMany.mockResolvedValue({ count: 0 })
    await expect(saveProductDraft('s1', 'p1', validInput)).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(product.update).not.toHaveBeenCalled()
  })
})

describe('submitProductForReview', () => {
  test('outro vendedor: não encontrado', async () => {
    product.findFirst.mockResolvedValue(null)
    await expect(submitProductForReview('s2', 'p1')).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
    expect(product.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'p1',
      sellerId: 's2',
    })
    expect(productRevision.updateMany).not.toHaveBeenCalled()
  })

  test('envia rascunho completo: revisão e produto vão para análise', async () => {
    product.findFirst.mockResolvedValue(productRow())
    await submitProductForReview('s1', 'p1')
    // primeiro trava a linha pelo status, depois relê e envia
    expect(productRevision.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'r1', status: { in: ['DRAFT', 'REJECTED'] } },
      data: { updatedAt: expect.any(Date) },
    })
    expect(product.findFirst).toHaveBeenCalledTimes(2)
    expect(productRevision.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      product.findFirst.mock.invocationCallOrder[1],
    )
    expect(productRevision.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'r1', status: { in: ['DRAFT', 'REJECTED'] } },
      data: expect.objectContaining({
        status: 'PENDING_REVIEW',
        submittedAt: expect.any(Date),
      }),
    })
    expect(product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'PENDING_REVIEW' },
    })
  })

  test('segundo envio: bloqueado', async () => {
    product.findFirst.mockResolvedValue(
      productRow({ status: 'PENDING_REVIEW' }, { status: 'PENDING_REVIEW' }),
    )
    await expect(submitProductForReview('s1', 'p1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(productRevision.updateMany).not.toHaveBeenCalled()
  })

  test('envio concorrente que perde a corrida: bloqueado', async () => {
    product.findFirst.mockResolvedValue(productRow())
    productRevision.updateMany.mockResolvedValue({ count: 0 })
    await expect(submitProductForReview('s1', 'p1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(product.update).not.toHaveBeenCalled()
  })

  test('publicado sem edição aberta: bloqueado', async () => {
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED', publishedAt: new Date() },
        { status: 'APPROVED' },
      ),
    )
    await expect(submitProductForReview('s1', 'p1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
  })

  test('edição de publicado vai para análise e o produto continua PUBLISHED', async () => {
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED', publishedAt: new Date(), liveRevisionId: 'r1' },
        { id: 'r2', version: 2 },
      ),
    )
    await submitProductForReview('s1', 'p1')
    expect(productRevision.updateMany.mock.calls[1][0].where.id).toBe('r2')
    expect(product.update).not.toHaveBeenCalled()
  })

  test('valida o que foi relido depois da trava, não a leitura inicial', async () => {
    product.findFirst
      .mockResolvedValueOnce(productRow())
      .mockResolvedValueOnce(productRow({}, { title: 'ab' }))
    await expect(submitProductForReview('s1', 'p1')).rejects.toBeInstanceOf(
      ProductIncompleteError,
    )
    expect(productRevision.updateMany).toHaveBeenCalledTimes(1) // só a trava
    expect(product.update).not.toHaveBeenCalled()
  })

  test('incompleto: lista o que falta e nada é gravado', async () => {
    product.findFirst.mockResolvedValue(
      productRow({}, { title: 'ab', priceCents: 500, _count: { files: 0 } }),
    )
    const error = await submitProductForReview('s1', 'p1').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ProductIncompleteError)
    expect((error as InstanceType<typeof ProductIncompleteError>).missing).toEqual([
      'basics',
      'files',
      'price',
    ])
    // só a trava (desfeita no rollback); a revisão não vai para análise
    expect(productRevision.updateMany).toHaveBeenCalledTimes(1)
    expect(productRevision.updateMany.mock.calls[0][0].data).toEqual({
      updatedAt: expect.any(Date),
    })
    expect(product.update).not.toHaveBeenCalled()
  })
})

describe('ensureWorkingRevision', () => {
  test('rascunho: devolve a própria revisão travando a linha pelo status', async () => {
    product.findFirst.mockResolvedValue(productRow({}, { id: 'r7' }))
    await expect(ensureWorkingRevision(db as never, 's1', 'p1')).resolves.toEqual({
      revisionId: 'r7',
    })
    expect(productRevision.updateMany).toHaveBeenCalledWith({
      where: { id: 'r7', status: { in: ['DRAFT', 'REJECTED'] } },
      data: { updatedAt: expect.any(Date) },
    })
    expect(productRevision.create).not.toHaveBeenCalled()
  })

  test('envio concorrente levou a revisão para análise: bloqueado e nada é criado', async () => {
    product.findFirst.mockResolvedValue(productRow({}, { id: 'r7' }))
    productRevision.updateMany.mockResolvedValue({ count: 0 })
    await expect(ensureWorkingRevision(db as never, 's1', 'p1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(productRevision.create).not.toHaveBeenCalled()
    expect(product.update).not.toHaveBeenCalled()
  })

  test('aprovada: abre a próxima versão com os mesmos arquivos', async () => {
    productRevision.create.mockResolvedValue({ id: 'r4' })
    product.findFirst.mockResolvedValue(
      productRow(
        { status: 'PUBLISHED' },
        { status: 'APPROVED', version: 3, files: [] },
      ),
    )
    await expect(ensureWorkingRevision(db as never, 's1', 'p1')).resolves.toEqual({
      revisionId: 'r4',
    })
    expect(productRevision.create.mock.calls[0][0].data).toMatchObject({
      version: 4,
      status: 'DRAFT',
      files: { create: [] },
    })
  })

  test('em análise ou de outro vendedor: erro', async () => {
    product.findFirst.mockResolvedValue(productRow({}, { status: 'PENDING_REVIEW' }))
    await expect(ensureWorkingRevision(db as never, 's1', 'p1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    product.findFirst.mockResolvedValue(null)
    await expect(ensureWorkingRevision(db as never, 's2', 'p1')).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
  })
})
