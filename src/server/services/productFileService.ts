import 'server-only'
import { randomUUID } from 'node:crypto'
import type { FileKind } from '@/generated/prisma/enums'
import { env, r2ProductsEnabled } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { createPresignedPutUrl, deleteObject, headObject } from '@/lib/r2'
import { slugify } from '@/lib/utils'
import {
  type ConfirmProductUploadInput,
  confirmProductUploadSchema,
  FILE_RULES,
  normalizeContentType,
  type ProductUploadInput,
  productUploadSchema,
  validateUpload,
} from '@/schemas/productSchema'
import {
  ensureWorkingRevision,
  ProductLockedError,
  ProductNotFoundError,
  planDraftSave,
} from './productService'

export { FILE_RULES, validateUpload }

// ---------------------------------------------------------------------------
// Erros de domínio (a action traduz para mensagem)
// ---------------------------------------------------------------------------

/** R2 (ou o bucket privado) não configurado. */
export class UploadsUnavailableError extends Error {
  constructor() {
    super('Product uploads are unavailable')
    this.name = 'UploadsUnavailableError'
  }
}

export type UploadRejection =
  | 'typeNotAllowed'
  | 'tooLarge'
  | 'empty'
  | 'tooMany'
  | 'invalidKey'
  | 'missing'

export class UploadRejectedError extends Error {
  constructor(readonly reason: UploadRejection) {
    super(`Upload rejected: ${reason}`)
    this.name = 'UploadRejectedError'
  }
}

// ---------------------------------------------------------------------------
// Chave no R2 (puro)
// ---------------------------------------------------------------------------

const MAX_NAME_CHARS = 60
const MAX_EXT_CHARS = 10

function splitFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return { base: fileName, ext: '' }
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot + 1) }
}

/** `products/{productId}/{kind}/{id}-{nome}.{ext}` — só [a-z0-9-] no nome. */
export function productFileKey(
  productId: string,
  kind: FileKind,
  fileName: string,
): string {
  const { base, ext } = splitFileName(fileName.trim())
  const name = slugify(base).slice(0, MAX_NAME_CHARS) || 'arquivo'
  const extension =
    ext
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, MAX_EXT_CHARS) || 'bin'
  const id = randomUUID().replaceAll('-', '')
  return `products/${productId}/${kind}/${id}-${name}.${extension}`
}

// O resto da chave depois do prefixo tem o formato exato que `productFileKey`
// gera: sem "/", sem "..", sem nada fora de [a-z0-9-].
const KEY_TAIL = /^[a-z0-9]+-[a-z0-9-]+\.[a-z0-9]+$/

/** A chave é de um arquivo deste produto e deste tipo? */
export function keyBelongsTo(key: string, productId: string, kind: FileKind): boolean {
  if (!productId || productId.includes('/') || productId.includes('.')) return false
  const prefix = `products/${productId}/${kind}/`
  return key.startsWith(prefix) && KEY_TAIL.test(key.slice(prefix.length))
}

// ---------------------------------------------------------------------------
// Infra
// ---------------------------------------------------------------------------

// Entregável: bucket privado, sempre. Prévia e capa: público.
function bucketFor(kind: FileKind): string {
  const bucket = FILE_RULES[kind].public ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET
  if (!r2ProductsEnabled || !bucket) throw new UploadsUnavailableError()
  return bucket
}

/**
 * Apaga do R2 só as chaves que nenhuma linha de `ProductFile` usa mais — a
 * revisão nova de um produto publicado copia as linhas com a mesma `r2Key`,
 * então o arquivo da versão no ar continua lá. Nunca lança: objeto órfão é
 * lixo, não erro para o vendedor.
 */
async function deleteUnreferenced(bucket: string, keys: string[]) {
  for (const key of keys) {
    try {
      const references = await prisma.productFile.count({ where: { r2Key: key } })
      if (references === 0) await deleteObject(bucket, key)
    } catch (error) {
      console.error('[productFileService] falha ao apagar objeto do R2', error)
    }
  }
}

// Produto do vendedor (não arquivado) + revisão mais recente, sem escrever
// nada. Outro vendedor = inexistente.
async function findOwnedLatest(sellerId: string, productId: string, kind: FileKind) {
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId, status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { status: true, _count: { select: { files: { where: { kind } } } } },
      },
    },
  })
  if (!product) throw new ProductNotFoundError()
  return product.revisions[0] ?? null
}

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

/**
 * Valida tipo/tamanho/quantidade e devolve a URL assinada de PUT. Não grava
 * nada no banco: a linha só nasce em `confirmProductUpload`, depois que o
 * objeto existe de verdade no R2.
 */
export async function requestProductUpload(
  sellerId: string,
  input: ProductUploadInput,
): Promise<{ url: string; key: string }> {
  const { productId, kind, fileName, contentType, sizeBytes } =
    productUploadSchema.parse(input)
  const bucket = bucketFor(kind)

  const check = validateUpload(kind, contentType, sizeBytes)
  if (check !== 'ok') throw new UploadRejectedError(check)

  const latest = await findOwnedLatest(sellerId, productId, kind)
  if (planDraftSave(latest) === 'locked') throw new ProductLockedError()
  const { maxCount } = FILE_RULES[kind]
  // maxCount 1 substitui o anterior; acima disso, recusa o excedente
  if (maxCount > 1 && (latest?._count.files ?? 0) >= maxCount) {
    throw new UploadRejectedError('tooMany')
  }

  const key = productFileKey(productId, kind, fileName)
  const url = await createPresignedPutUrl(bucket, key, contentType, sizeBytes)
  return { url, key }
}

/**
 * Anexa o objeto enviado à revisão de trabalho. Confere prefixo da chave,
 * dono do produto e o objeto real no R2 (tamanho e tipo); qualquer recusa
 * depois de confirmar o dono apaga o objeto enviado e não grava nada.
 */
export async function confirmProductUpload(
  sellerId: string,
  input: ConfirmProductUploadInput,
): Promise<{ fileId: string }> {
  const { productId, kind, key, fileName } = confirmProductUploadSchema.parse(input)
  const bucket = bucketFor(kind)
  if (!keyBelongsTo(key, productId, kind)) throw new UploadRejectedError('invalidKey')

  // Antes de qualquer delete: a chave pode ser do produto de outro vendedor.
  const latest = await findOwnedLatest(sellerId, productId, kind)

  let uploaded = true
  try {
    if (planDraftSave(latest) === 'locked') throw new ProductLockedError()

    const head = await headObject(bucket, key)
    if (!head) {
      uploaded = false
      throw new UploadRejectedError('missing')
    }
    const contentType =
      normalizeContentType(head.contentType ?? '') || 'application/octet-stream'
    const check = validateUpload(kind, contentType, head.contentLength)
    if (check !== 'ok') throw new UploadRejectedError(check)

    const replacedKeys: string[] = []
    const created = await prisma.$transaction(async (tx) => {
      // trava a revisão de trabalho: serializa com um envio para análise e
      // com outra confirmação concorrente
      const { revisionId } = await ensureWorkingRevision(tx, sellerId, productId)
      // confirmar duas vezes a mesma chave (ou a chave de um arquivo já
      // anexado) duplicaria a linha
      if ((await tx.productFile.count({ where: { r2Key: key } })) > 0) {
        throw new UploadRejectedError('invalidKey')
      }

      const { maxCount } = FILE_RULES[kind]
      if (maxCount === 1) {
        const previous = await tx.productFile.findMany({
          where: { revisionId, kind },
          select: { id: true, r2Key: true },
        })
        if (previous.length > 0) {
          await tx.productFile.deleteMany({
            where: { id: { in: previous.map((file) => file.id) } },
          })
          replacedKeys.push(...previous.map((file) => file.r2Key))
        }
      } else {
        const count = await tx.productFile.count({ where: { revisionId, kind } })
        if (count >= maxCount) throw new UploadRejectedError('tooMany')
      }

      return tx.productFile.create({
        data: {
          revisionId,
          kind,
          r2Key: key,
          fileName,
          contentType,
          sizeBytes: head.contentLength,
        },
        select: { id: true },
      })
    })

    await deleteUnreferenced(bucket, replacedKeys)
    return { fileId: created.id }
  } catch (error) {
    // só apaga se nenhuma linha usa a chave (caso "já anexada")
    if (uploaded) await deleteUnreferenced(bucket, [key])
    throw error
  }
}

/**
 * Remove o arquivo da revisão de trabalho. Se o arquivo é da versão no ar, a
 * revisão nova (aberta aqui) perde a cópia e o objeto fica no R2 para a
 * versão publicada.
 */
export async function removeProductFile(
  sellerId: string,
  fileId: string,
): Promise<void> {
  if (!r2ProductsEnabled) throw new UploadsUnavailableError()

  const file = await prisma.productFile.findFirst({
    where: {
      id: fileId,
      revision: { product: { sellerId, status: { not: 'ARCHIVED' } } },
    },
    select: {
      id: true,
      kind: true,
      r2Key: true,
      revisionId: true,
      revision: { select: { productId: true } },
    },
  })
  if (!file) throw new ProductNotFoundError()
  const bucket = bucketFor(file.kind)

  await prisma.$transaction(async (tx) => {
    const { revisionId } = await ensureWorkingRevision(
      tx,
      sellerId,
      file.revision.productId,
    )
    const where =
      revisionId === file.revisionId
        ? { revisionId, id: file.id }
        : { revisionId, r2Key: file.r2Key, kind: file.kind }
    const { count } = await tx.productFile.deleteMany({ where })
    if (count === 0) throw new ProductNotFoundError()
  })

  await deleteUnreferenced(bucket, [file.r2Key])
}
