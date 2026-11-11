import 'server-only'
import { randomUUID } from 'node:crypto'
import type { Prisma } from '@/generated/prisma/client'
import type { CaptureKind, ProductType, RevisionStatus } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import {
  type ChecklistItem,
  PRODUCT_KINDS,
  type ProductDraft,
  type ProductDraftInput,
  productDraftSchema,
  STYLE_OPTIONS,
  submitChecklist,
} from '@/schemas/productSchema'

// ---------------------------------------------------------------------------
// Erros de domínio (a action traduz para mensagem)
// ---------------------------------------------------------------------------

/** Produto não existe ou é de outro vendedor — os dois casos são iguais por fora. */
export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found')
    this.name = 'ProductNotFoundError'
  }
}

/** Revisão em análise (ou sem revisão aberta para enviar): só leitura. */
export class ProductLockedError extends Error {
  constructor() {
    super('Product is locked')
    this.name = 'ProductLockedError'
  }
}

export class ProductIncompleteError extends Error {
  constructor(readonly missing: ChecklistItem['id'][]) {
    super(`Product incomplete: ${missing.join(', ')}`)
    this.name = 'ProductIncompleteError'
  }
}

// ---------------------------------------------------------------------------
// Decisões puras (testadas sem banco)
// ---------------------------------------------------------------------------

const WORKING_STATUSES = ['DRAFT', 'REJECTED'] as const satisfies RevisionStatus[]

function isWorking(status: RevisionStatus) {
  return (WORKING_STATUSES as readonly RevisionStatus[]).includes(status)
}

/**
 * O que fazer com uma edição, olhando a revisão mais recente:
 * - rascunho/recusada → grava nela (`update`);
 * - aprovada (produto no ar) ou nenhuma → abre a próxima versão (`newVersion`);
 * - em análise → `locked`.
 */
export function planDraftSave(
  latest: { status: RevisionStatus } | null,
): 'update' | 'newVersion' | 'locked' {
  if (!latest || latest.status === 'APPROVED') return 'newVersion'
  if (latest.status === 'PENDING_REVIEW') return 'locked'
  return 'update'
}

/** Só a revisão de trabalho (rascunho/recusada) pode ir para análise. */
export function planSubmit(latest: { status: RevisionStatus } | null): boolean {
  return latest !== null && isWorking(latest.status)
}

export function buildProductSlug(title: string): string {
  // slugify devolve '' para títulos sem letras latinas (ex.: só emojis)
  const base = slugify(title) || 'produto'
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6)
  return `${base}-${suffix}`
}

// "plexi-68-abc123" -> "plexi-68": regera o slug só quando o título muda.
function slugBase(slug: string) {
  return slug.replace(/-[0-9a-f]{6}$/, '')
}

// Preço na revisão (`Int?`): gratuito = 0, ainda sem preço = null.
function encodePrice(draft: ProductDraft): number | null {
  if (draft.free) return 0
  return draft.priceCents > 0 ? draft.priceCents : null
}

export function draftToRevisionData(draft: ProductDraft) {
  return {
    title: draft.title,
    description: draft.about,
    shortDescription: draft.shortDescription,
    includes: draft.includes,
    kinds: draft.kinds,
    kindOther: draft.kindOther || null,
    styles: draft.styles,
    styleOther: draft.styleOther || null,
    capturedAmp: draft.capturedAmp || null,
    captureKind: draft.captureKind ?? null,
    captureKindOther: draft.captureKindOther || null,
    youtubeUrl: draft.youtubeUrl || null,
    priceCents: encodePrice(draft),
  }
}

// Campos do Product espelhados enquanto ele nunca foi publicado.
function draftToProductData(draft: ProductDraft) {
  return {
    title: draft.title,
    description: draft.about,
    shortDescription: draft.shortDescription,
    kinds: draft.kinds,
    productType: draft.kinds[0] ?? 'PRESET',
    priceCents: draft.free ? 0 : draft.priceCents,
  } satisfies Prisma.ProductUpdateInput
}

export type RevisionDraftSource = {
  title: string
  description: string
  shortDescription: string | null
  includes: string[] | null
  kinds: ProductType[] | null
  kindOther: string | null
  styles: string[] | null
  styleOther: string | null
  capturedAmp: string | null
  captureKind: CaptureKind | null
  captureKindOther: string | null
  youtubeUrl: string | null
  priceCents: number | null
}

const DRAFT_KINDS = new Set<string>(PRODUCT_KINDS)
const STYLES = new Set<string>(STYLE_OPTIONS)

/**
 * Revisão do banco -> rascunho do form. Linhas antigas podem ter as listas
 * nulas: `kinds` vazio vira `[productType]`, e valores fora das opções atuais
 * (estilos antigos, MIDI_PATCH/BUNDLE) são descartados.
 */
export function revisionToDraft(
  revision: RevisionDraftSource,
  productType: ProductType,
): ProductDraft {
  const storedKinds = revision.kinds?.length ? revision.kinds : [productType]
  return {
    kinds: storedKinds.filter((kind): kind is ProductDraft['kinds'][number] =>
      DRAFT_KINDS.has(kind),
    ),
    kindOther: revision.kindOther ?? undefined,
    title: revision.title,
    shortDescription: revision.shortDescription ?? '',
    about: revision.description,
    includes: revision.includes ?? [],
    styles: (revision.styles ?? []).filter(
      (style): style is ProductDraft['styles'][number] => STYLES.has(style),
    ),
    styleOther: revision.styleOther ?? undefined,
    capturedAmp: revision.capturedAmp ?? undefined,
    captureKind: revision.captureKind ?? undefined,
    captureKindOther: revision.captureKindOther ?? undefined,
    youtubeUrl: revision.youtubeUrl ?? undefined,
    priceCents: revision.priceCents ?? 0,
    free: revision.priceCents === 0,
  }
}

// ---------------------------------------------------------------------------
// Fluxos com banco
// ---------------------------------------------------------------------------

const MAX_SLUG_ATTEMPTS = 3

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

export async function createProductDraft(
  sellerId: string,
  input: ProductDraftInput,
): Promise<{ productId: string }> {
  const draft = productDraftSchema.parse(input)
  for (let attempt = 1; ; attempt++) {
    try {
      // create aninhado: produto + revisão v1 numa única transação
      const created = await prisma.product.create({
        data: {
          sellerId,
          instrument: 'GUITAR',
          status: 'DRAFT',
          slug: buildProductSlug(draft.title),
          ...draftToProductData(draft),
          revisions: {
            create: { version: 1, status: 'DRAFT', ...draftToRevisionData(draft) },
          },
        },
        select: { id: true },
      })
      return { productId: created.id }
    } catch (error) {
      // colisão do sufixo aleatório do slug: tenta de novo com outro
      if (!isUniqueViolation(error) || attempt >= MAX_SLUG_ATTEMPTS) throw error
    }
  }
}

// Produto do vendedor + revisão mais recente. `sellerId` no where: produto de
// outro vendedor é indistinguível de produto inexistente. Arquivado também.
async function findOwnedProduct(
  tx: Prisma.TransactionClient,
  sellerId: string,
  productId: string,
) {
  const product = await tx.product.findFirst({
    where: { id: productId, sellerId, status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      status: true,
      productType: true,
      slug: true,
      publishedAt: true,
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          files: {
            select: {
              kind: true,
              r2Key: true,
              fileName: true,
              contentType: true,
              sizeBytes: true,
            },
          },
          _count: { select: { files: { where: { kind: 'DELIVERABLE' } } } },
        },
      },
    },
  })
  if (!product) throw new ProductNotFoundError()
  return { product, latest: product.revisions[0] ?? null }
}

/**
 * Garante a revisão de trabalho (rascunho/recusada) do produto, criando a
 * próxima versão — com cópia dos arquivos — se a mais recente está aprovada.
 * Lança `ProductNotFoundError`/`ProductLockedError`. Reutilizada pelos uploads.
 */
export async function ensureWorkingRevision(
  tx: Prisma.TransactionClient,
  sellerId: string,
  productId: string,
): Promise<{ revisionId: string }> {
  const { latest } = await findOwnedProduct(tx, sellerId, productId)
  const plan = planDraftSave(latest)
  if (plan === 'locked') throw new ProductLockedError()
  if (plan === 'update' && latest) {
    // UPDATE condicionado ao status: segura o lock da linha até o commit e
    // serializa o upload com um envio/salvamento concorrente. Se o envio
    // ganhou a corrida (revisão já em análise), nada é anexado.
    const { count } = await tx.productRevision.updateMany({
      where: { id: latest.id, status: { in: [...WORKING_STATUSES] } },
      data: { updatedAt: new Date() },
    })
    if (count === 0) throw new ProductLockedError()
    return { revisionId: latest.id }
  }
  const created = await tx.productRevision.create({
    data: {
      productId,
      version: (latest?.version ?? 0) + 1,
      status: 'DRAFT',
      title: latest?.title ?? '',
      description: latest?.description ?? '',
      shortDescription: latest?.shortDescription ?? '',
      includes: latest?.includes ?? [],
      kinds: latest?.kinds ?? [],
      kindOther: latest?.kindOther ?? null,
      styles: latest?.styles ?? [],
      styleOther: latest?.styleOther ?? null,
      capturedAmp: latest?.capturedAmp ?? null,
      captureKind: latest?.captureKind ?? null,
      captureKindOther: latest?.captureKindOther ?? null,
      youtubeUrl: latest?.youtubeUrl ?? null,
      priceCents: latest?.priceCents ?? null,
      inspiredBy: latest?.inspiredBy ?? null,
      compatibility: latest?.compatibility ?? [],
      files: { create: latest?.files ?? [] },
    },
    select: { id: true },
  })
  return { revisionId: created.id }
}

export async function saveProductDraft(
  sellerId: string,
  productId: string,
  input: ProductDraftInput,
): Promise<void> {
  const draft = productDraftSchema.parse(input)
  const revisionData = draftToRevisionData(draft)

  await prisma.$transaction(async (tx) => {
    const { product, latest } = await findOwnedProduct(tx, sellerId, productId)
    const plan = planDraftSave(latest)
    if (plan === 'locked') throw new ProductLockedError()

    if (plan === 'newVersion') {
      // Produto no ar: a edição vira a versão seguinte. `liveRevisionId` e os
      // campos do Product continuam os da versão aprovada até a nova passar.
      await tx.productRevision.create({
        data: {
          productId,
          version: (latest?.version ?? 0) + 1,
          status: 'DRAFT',
          ...revisionData,
          inspiredBy: latest?.inspiredBy ?? null,
          compatibility: latest?.compatibility ?? [],
          // novas linhas, mesmas r2Key: o arquivo no R2 é compartilhado
          files: { create: latest?.files ?? [] },
        },
      })
    } else if (latest) {
      // `status` no where: se um envio concorrente já levou a revisão para
      // análise, nada é gravado.
      const { count } = await tx.productRevision.updateMany({
        where: { id: latest.id, status: { in: [...WORKING_STATUSES] } },
        data: { ...revisionData, status: 'DRAFT', rejectionReason: null },
      })
      if (count === 0) throw new ProductLockedError()
    }

    // Espelha no Product só o que nunca foi ao ar. `status` também conta: um
    // PUBLISHED aprovado sem `publishedAt` não pode ter o produto no ar
    // sobrescrito pelo rascunho.
    if (product.publishedAt === null && product.status !== 'PUBLISHED') {
      const productData = draftToProductData(draft)
      const titleChanged =
        slugBase(product.slug) !== (slugify(draft.title) || 'produto')
      await tx.product.update({
        where: { id: product.id },
        data: {
          ...productData,
          ...(titleChanged ? { slug: buildProductSlug(draft.title) } : {}),
          ...(product.status === 'REJECTED' ? { status: 'DRAFT' as const } : {}),
        },
      })
    }
  })
}

export async function submitProductForReview(
  sellerId: string,
  productId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const first = await findOwnedProduct(tx, sellerId, productId)
    if (!first.latest || !planSubmit(first.latest)) throw new ProductLockedError()

    // Trava a linha da revisão antes de validar (UPDATE condicionado ao
    // status, como em `ensureWorkingRevision`): um salvamento ou upload
    // concorrente espera o commit, e a validação abaixo lê o estado final.
    const touched = await tx.productRevision.updateMany({
      where: { id: first.latest.id, status: { in: [...WORKING_STATUSES] } },
      data: { updatedAt: new Date() },
    })
    if (touched.count === 0) throw new ProductLockedError()

    const { product, latest } = await findOwnedProduct(tx, sellerId, productId)
    if (!latest || latest.id !== first.latest.id || !planSubmit(latest)) {
      throw new ProductLockedError()
    }

    const draft = revisionToDraft(latest, product.productType)
    const missing = submitChecklist(draft, latest._count.files)
      .filter((item) => !item.ok)
      .map((item) => item.id)
    if (missing.length > 0) throw new ProductIncompleteError(missing)

    const { count } = await tx.productRevision.updateMany({
      where: { id: latest.id, status: { in: [...WORKING_STATUSES] } },
      data: {
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
        rejectionReason: null,
      },
    })
    // segundo envio concorrente: a outra requisição já mudou o status
    if (count === 0) throw new ProductLockedError()

    // publicado continua PUBLISHED (a versão no ar não muda até a aprovação)
    if (product.status === 'DRAFT' || product.status === 'REJECTED') {
      await tx.product.update({
        where: { id: product.id },
        data: { status: 'PENDING_REVIEW' },
      })
    }
  })
}
