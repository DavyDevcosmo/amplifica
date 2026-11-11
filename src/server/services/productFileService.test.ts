import { beforeEach, describe, expect, test, vi } from 'vitest'

const product = { findFirst: vi.fn() }
const productFile = {
  count: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
}
const db = {
  product,
  productFile,
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
}

const ensureWorkingRevision = vi.fn()
const r2 = {
  createPresignedPutUrl: vi.fn(),
  headObject: vi.fn(),
  deleteObject: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({ prisma: db }))
vi.mock('@/lib/env', () => ({
  env: { R2_PUBLIC_BUCKET: 'public-bucket', R2_PRIVATE_BUCKET: 'private-bucket' },
  r2ProductsEnabled: true,
}))
vi.mock('@/lib/r2', () => r2)
vi.mock('./productService', async (importOriginal) => {
  const original = await importOriginal<typeof import('./productService')>()
  return { ...original, ensureWorkingRevision }
})

const {
  confirmProductUpload,
  keyBelongsTo,
  productFileKey,
  removeProductFile,
  requestProductUpload,
  UploadRejectedError,
  validateUpload,
} = await import('./productFileService')
const { ProductLockedError, ProductNotFoundError } = await import('./productService')

const MB = 1024 * 1024

test('validateUpload', () => {
  expect(validateUpload('DELIVERABLE', 'application/octet-stream', 48_000)).toBe('ok')
  expect(validateUpload('DELIVERABLE', 'application/zip', 200 * 1024 * 1024 + 1)).toBe(
    'tooLarge',
  )
  expect(validateUpload('PREVIEW_AUDIO', 'audio/ogg', 1000)).toBe('typeNotAllowed')
  // alguns navegadores no Windows mandam audio/mp3 para .mp3
  expect(validateUpload('PREVIEW_AUDIO', 'audio/mp3', 1000)).toBe('ok')
  expect(validateUpload('PREVIEW_AUDIO', 'audio/mpeg', 1000)).toBe('ok')
  expect(validateUpload('COVER_IMAGE', 'image/png', 0)).toBe('empty')
})

test('keyBelongsTo recusa outro produto, outro tipo e path traversal', () => {
  const key = productFileKey('p1', 'DELIVERABLE', 'Plexi 68.hlx')
  expect(key).toMatch(/^products\/p1\/DELIVERABLE\/[a-z0-9]+-plexi-68\.hlx$/)
  expect(keyBelongsTo(key, 'p1', 'DELIVERABLE')).toBe(true)
  expect(keyBelongsTo(key, 'p2', 'DELIVERABLE')).toBe(false)
  expect(keyBelongsTo(key, 'p1', 'COVER_IMAGE')).toBe(false)
  expect(keyBelongsTo('products/p1/DELIVERABLE/../../p2/x', 'p1', 'DELIVERABLE')).toBe(
    false,
  )
})

describe('productFileKey', () => {
  test('nome sem letras latinas vira "arquivo"; sem extensão vira .bin', () => {
    expect(productFileKey('p1', 'DELIVERABLE', '🎸🎸.zip')).toMatch(/-arquivo\.zip$/)
    expect(productFileKey('p1', 'DELIVERABLE', 'pack')).toMatch(/-pack\.bin$/)
  })

  test('keyBelongsTo recusa barra extra e chave de outro prefixo', () => {
    expect(keyBelongsTo('products/p1/DELIVERABLE/a/b-c.zip', 'p1', 'DELIVERABLE')).toBe(
      false,
    )
    expect(keyBelongsTo('avatars/p1/DELIVERABLE/abc-c.zip', 'p1', 'DELIVERABLE')).toBe(
      false,
    )
    expect(keyBelongsTo('products/p1/DELIVERABLE/abc-c.zip', 'p1', 'DELIVERABLE')).toBe(
      true,
    )
  })
})

function ownedProduct(status = 'DRAFT', deliverables = 0) {
  return { id: 'p1', revisions: [{ status, _count: { files: deliverables } }] }
}

beforeEach(() => {
  vi.clearAllMocks()
  db.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(db))
  ensureWorkingRevision.mockResolvedValue({ revisionId: 'r1' })
  productFile.findMany.mockResolvedValue([])
  productFile.count.mockResolvedValue(0)
  productFile.create.mockResolvedValue({ id: 'f-new' })
  productFile.deleteMany.mockResolvedValue({ count: 1 })
  r2.createPresignedPutUrl.mockResolvedValue('https://signed.example/put')
})

describe('requestProductUpload', () => {
  const input = {
    productId: 'p1',
    kind: 'DELIVERABLE' as const,
    fileName: 'Plexi 68.hlx',
    contentType: 'application/octet-stream',
    sizeBytes: 48_000,
  }

  test('entregável é assinado no bucket privado com o prefixo do produto', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    const result = await requestProductUpload('s1', input)
    expect(product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1', sellerId: 's1', status: { not: 'ARCHIVED' } },
      }),
    )
    expect(r2.createPresignedPutUrl).toHaveBeenCalledWith(
      'private-bucket',
      result.key,
      'application/octet-stream',
      48_000,
    )
    expect(keyBelongsTo(result.key, 'p1', 'DELIVERABLE')).toBe(true)
    expect(result.url).toBe('https://signed.example/put')
  })

  test('capa vai para o bucket público', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    await requestProductUpload('s1', {
      ...input,
      kind: 'COVER_IMAGE',
      fileName: 'capa.png',
      contentType: 'image/png',
    })
    expect(r2.createPresignedPutUrl.mock.calls[0]?.[0]).toBe('public-bucket')
  })

  test('produto de outro vendedor: ProductNotFoundError e nada assinado', async () => {
    product.findFirst.mockResolvedValue(null)
    await expect(requestProductUpload('s2', input)).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
    expect(r2.createPresignedPutUrl).not.toHaveBeenCalled()
  })

  test('produto em análise: ProductLockedError', async () => {
    product.findFirst.mockResolvedValue(ownedProduct('PENDING_REVIEW'))
    await expect(requestProductUpload('s1', input)).rejects.toBeInstanceOf(
      ProductLockedError,
    )
  })

  test('tipo, tamanho e quantidade inválidos são recusados antes de assinar', async () => {
    product.findFirst.mockResolvedValue(ownedProduct('DRAFT', 20))
    await expect(
      requestProductUpload('s1', {
        ...input,
        kind: 'PREVIEW_AUDIO',
        contentType: 'audio/ogg',
      }),
    ).rejects.toMatchObject({ reason: 'typeNotAllowed' })
    await expect(
      requestProductUpload('s1', { ...input, sizeBytes: 200 * MB + 1 }),
    ).rejects.toMatchObject({ reason: 'tooLarge' })
    await expect(requestProductUpload('s1', input)).rejects.toMatchObject({
      reason: 'tooMany',
    })
    expect(r2.createPresignedPutUrl).not.toHaveBeenCalled()
  })
})

describe('confirmProductUpload', () => {
  const key = productFileKey('p1', 'DELIVERABLE', 'Plexi 68.hlx')
  const input = {
    productId: 'p1',
    kind: 'DELIVERABLE' as const,
    key,
    fileName: 'Plexi 68.hlx',
  }

  test('chave fora do prefixo do produto: recusa sem tocar banco nem R2', async () => {
    for (const badKey of [
      productFileKey('p2', 'DELIVERABLE', 'x.zip'),
      productFileKey('p1', 'COVER_IMAGE', 'x.png'),
      'products/p1/DELIVERABLE/../../p2/x',
    ]) {
      await expect(
        confirmProductUpload('s1', { ...input, key: badKey }),
      ).rejects.toMatchObject({ reason: 'invalidKey' })
    }
    expect(product.findFirst).not.toHaveBeenCalled()
    expect(r2.headObject).not.toHaveBeenCalled()
    expect(r2.deleteObject).not.toHaveBeenCalled()
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test('produto de outro vendedor: ProductNotFoundError e o objeto não é apagado', async () => {
    product.findFirst.mockResolvedValue(null)
    await expect(confirmProductUpload('s2', input)).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
    expect(r2.headObject).not.toHaveBeenCalled()
    expect(r2.deleteObject).not.toHaveBeenCalled()
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test.each([
    ['tooLarge', { contentLength: 200 * MB + 1, contentType: 'application/zip' }],
    ['empty', { contentLength: 0, contentType: 'application/zip' }],
  ])('objeto %s: apaga do R2 e não grava', async (reason, head) => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue(head)
    await expect(confirmProductUpload('s1', input)).rejects.toMatchObject({ reason })
    expect(r2.deleteObject).toHaveBeenCalledWith('private-bucket', key)
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test('tipo não permitido no objeto enviado: apaga e não grava', async () => {
    const coverKey = productFileKey('p1', 'COVER_IMAGE', 'capa.png')
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({ contentLength: 1000, contentType: 'image/gif' })
    await expect(
      confirmProductUpload('s1', { ...input, kind: 'COVER_IMAGE', key: coverKey }),
    ).rejects.toMatchObject({ reason: 'typeNotAllowed' })
    expect(r2.deleteObject).toHaveBeenCalledWith('public-bucket', coverKey)
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test('upload que não chegou ao R2: recusa e não grava', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue(null)
    await expect(confirmProductUpload('s1', input)).rejects.toMatchObject({
      reason: 'missing',
    })
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test('chave já usada por outro arquivo: recusa sem apagar o objeto', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({
      contentLength: 1000,
      contentType: 'application/zip',
    })
    productFile.count.mockResolvedValue(1)
    await expect(confirmProductUpload('s1', input)).rejects.toMatchObject({
      reason: 'invalidKey',
    })
    expect(r2.deleteObject).not.toHaveBeenCalled()
    expect(productFile.create).not.toHaveBeenCalled()
  })

  test('entregável válido: grava na revisão de trabalho, dentro da transação', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({
      contentLength: 48_000,
      contentType: 'application/zip',
    })
    productFile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(3)
    const result = await confirmProductUpload('s1', input)
    expect(ensureWorkingRevision).toHaveBeenCalledWith(db, 's1', 'p1')
    expect(productFile.create).toHaveBeenCalledWith({
      data: {
        revisionId: 'r1',
        kind: 'DELIVERABLE',
        r2Key: key,
        fileName: 'Plexi 68.hlx',
        contentType: 'application/zip',
        sizeBytes: 48_000,
      },
      select: { id: true },
    })
    expect(result).toEqual({ fileId: 'f-new' })
    expect(r2.deleteObject).not.toHaveBeenCalled()
  })

  test('21º entregável: recusa e apaga o objeto enviado', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({
      contentLength: 48_000,
      contentType: 'application/zip',
    })
    productFile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(20)
    await expect(confirmProductUpload('s1', input)).rejects.toMatchObject({
      reason: 'tooMany',
    })
    expect(productFile.create).not.toHaveBeenCalled()
    expect(r2.deleteObject).toHaveBeenCalledWith('private-bucket', key)
  })

  test('produto foi para análise no meio do upload: não grava e apaga o objeto', async () => {
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({
      contentLength: 48_000,
      contentType: 'application/zip',
    })
    ensureWorkingRevision.mockRejectedValue(new ProductLockedError())
    await expect(confirmProductUpload('s1', input)).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(productFile.create).not.toHaveBeenCalled()
    expect(r2.deleteObject).toHaveBeenCalledWith('private-bucket', key)
  })

  test('capa nova substitui a anterior; objeto antigo só sai se ninguém mais usa', async () => {
    const coverKey = productFileKey('p1', 'COVER_IMAGE', 'nova.png')
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({ contentLength: 1000, contentType: 'image/png' })
    productFile.findMany.mockResolvedValue([
      { id: 'f-old', r2Key: 'products/p1/COVER_IMAGE/aaa-velha.png' },
    ])
    // 1ª: chave nova não usada; 2ª: chave antiga ainda usada pela versão no ar
    productFile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    await confirmProductUpload('s1', { ...input, kind: 'COVER_IMAGE', key: coverKey })
    expect(productFile.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['f-old'] } },
    })
    expect(productFile.create).toHaveBeenCalled()
    expect(r2.deleteObject).not.toHaveBeenCalled()
  })

  test('capa substituída sem outra referência: objeto antigo sai do bucket público', async () => {
    const coverKey = productFileKey('p1', 'COVER_IMAGE', 'nova.png')
    product.findFirst.mockResolvedValue(ownedProduct())
    r2.headObject.mockResolvedValue({ contentLength: 1000, contentType: 'image/png' })
    productFile.findMany.mockResolvedValue([
      { id: 'f-old', r2Key: 'products/p1/COVER_IMAGE/aaa-velha.png' },
    ])
    productFile.count.mockResolvedValue(0)
    await confirmProductUpload('s1', { ...input, kind: 'COVER_IMAGE', key: coverKey })
    expect(r2.deleteObject).toHaveBeenCalledWith(
      'public-bucket',
      'products/p1/COVER_IMAGE/aaa-velha.png',
    )
  })
})

describe('removeProductFile', () => {
  const file = {
    id: 'f1',
    kind: 'DELIVERABLE',
    r2Key: 'products/p1/DELIVERABLE/abc-plexi.hlx',
    revisionId: 'r1',
    revision: { productId: 'p1' },
  }

  test('arquivo de outro vendedor: ProductNotFoundError e nada apagado', async () => {
    productFile.findFirst.mockResolvedValue(null)
    await expect(removeProductFile('s2', 'f1')).rejects.toBeInstanceOf(
      ProductNotFoundError,
    )
    expect(productFile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'f1',
          revision: { product: { sellerId: 's2', status: { not: 'ARCHIVED' } } },
        },
      }),
    )
    expect(productFile.deleteMany).not.toHaveBeenCalled()
    expect(r2.deleteObject).not.toHaveBeenCalled()
  })

  test('apaga a linha e o objeto quando ninguém mais usa a chave', async () => {
    productFile.findFirst.mockResolvedValue(file)
    productFile.count.mockResolvedValue(0)
    await removeProductFile('s1', 'f1')
    expect(ensureWorkingRevision).toHaveBeenCalledWith(db, 's1', 'p1')
    expect(productFile.deleteMany).toHaveBeenCalledWith({
      where: { revisionId: 'r1', id: 'f1' },
    })
    expect(r2.deleteObject).toHaveBeenCalledWith('private-bucket', file.r2Key)
  })

  test('arquivo da versão no ar: remove a cópia da revisão nova e mantém o objeto', async () => {
    productFile.findFirst.mockResolvedValue(file)
    ensureWorkingRevision.mockResolvedValue({ revisionId: 'r2' })
    productFile.count.mockResolvedValue(1)
    await removeProductFile('s1', 'f1')
    expect(productFile.deleteMany).toHaveBeenCalledWith({
      where: { revisionId: 'r2', r2Key: file.r2Key, kind: 'DELIVERABLE' },
    })
    expect(r2.deleteObject).not.toHaveBeenCalled()
  })

  test('produto em análise: ProductLockedError e nada apagado', async () => {
    productFile.findFirst.mockResolvedValue(file)
    ensureWorkingRevision.mockRejectedValue(new ProductLockedError())
    await expect(removeProductFile('s1', 'f1')).rejects.toBeInstanceOf(
      ProductLockedError,
    )
    expect(productFile.deleteMany).not.toHaveBeenCalled()
    expect(r2.deleteObject).not.toHaveBeenCalled()
  })
})

test('UploadRejectedError carrega o motivo', () => {
  expect(new UploadRejectedError('tooLarge').reason).toBe('tooLarge')
})
