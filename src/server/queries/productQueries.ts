import 'server-only'
import { founderStatus } from '@/components/seller/dashboard/founderStatus'
import type { Prisma } from '@/generated/prisma/client'
import type { FileKind, ProductType } from '@/generated/prisma/enums'
import { env, r2Enabled } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { publicUrlFor } from '@/lib/r2'
import {
  type ListStatus,
  listStatusOf,
  type ProductDraftInput,
} from '@/schemas/productSchema'
import { revisionToDraft } from '@/server/services/productService'

export type SellerProductRow = {
  id: string
  title: string
  kinds: ProductType[]
  kindOther: string | null
  capturedAmp: string | null
  priceCents: number
  salesCount: number
  status: ListStatus
  rejectionReason: string | null
  coverUrl: string | null
  updatedAt: Date
}

export type ProductEditData = {
  productId: string
  status: ListStatus
  draft: ProductDraftInput
  files: {
    id: string
    kind: FileKind
    fileName: string
    sizeBytes: number
    url: string | null
  }[]
  founderRemainingSales: number
}

// Só prévia e capa ficam no bucket público. DELIVERABLE nunca ganha URL.
const PUBLIC_KINDS: readonly FileKind[] = ['PREVIEW_AUDIO', 'COVER_IMAGE']

function publicFileUrl(kind: FileKind, r2Key: string): string | null {
  return r2Enabled && PUBLIC_KINDS.includes(kind) ? publicUrlFor(r2Key) : null
}

// Pedido pago (inclusive parcialmente reembolsado) e item não reembolsado.
const PAID_ITEM = {
  status: 'PAID',
  order: { status: { in: ['PAID', 'PARTIALLY_REFUNDED'] } },
} satisfies Prisma.OrderItemWhereInput

const rowRevisionSelect = {
  status: true,
  title: true,
  kinds: true,
  kindOther: true,
  capturedAmp: true,
  priceCents: true,
  rejectionReason: true,
  files: { where: { kind: 'COVER_IMAGE' }, select: { r2Key: true }, take: 1 },
} as const

/**
 * Produtos do vendedor para a lista (sem arquivados). O status vem da revisão
 * mais recente; título, preço e capa vêm da versão no ar quando o produto está
 * publicado, senão da revisão mais recente (o que o vendedor digitou).
 */
export async function getSellerProducts(sellerId: string): Promise<SellerProductRow[]> {
  const products = await prisma.product.findMany({
    where: { sellerId, status: { not: 'ARCHIVED' } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      productType: true,
      updatedAt: true,
      liveRevision: { select: rowRevisionSelect },
      revisions: { orderBy: { version: 'desc' }, take: 1, select: rowRevisionSelect },
      _count: { select: { orderItems: { where: PAID_ITEM } } },
    },
  })

  return products.flatMap((product) => {
    const latest = product.revisions[0] ?? null
    const status = listStatusOf(product, latest)
    if (!status) return []
    const shown =
      product.status === 'PUBLISHED' && product.liveRevision
        ? product.liveRevision
        : latest
    const cover = shown?.files[0]
    return [
      {
        id: product.id,
        title: shown?.title ?? '',
        kinds: shown?.kinds?.length ? shown.kinds : [product.productType],
        kindOther: shown?.kindOther ?? null,
        capturedAmp: shown?.capturedAmp ?? null,
        priceCents: shown?.priceCents ?? 0,
        salesCount: product._count.orderItems,
        status,
        rejectionReason:
          latest?.status === 'REJECTED' ? (latest.rejectionReason ?? null) : null,
        coverUrl: cover ? publicFileUrl('COVER_IMAGE', cover.r2Key) : null,
        updatedAt: product.updatedAt,
      },
    ]
  })
}

/**
 * Dados do form de edição. `null` se o produto não existe, é de outro
 * vendedor ou está arquivado — a página responde `notFound()`.
 */
export async function getProductForEdit(
  sellerId: string,
  productId: string,
): Promise<ProductEditData | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId, status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      status: true,
      productType: true,
      seller: { select: { isFounder: true, founderWaivedSalesCount: true } },
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          files: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              kind: true,
              r2Key: true,
              fileName: true,
              sizeBytes: true,
            },
          },
        },
      },
    },
  })
  if (!product) return null
  const latest = product.revisions[0] ?? null
  const status = listStatusOf(product, latest)
  if (!status) return null

  return {
    productId: product.id,
    status,
    draft: latest ? revisionToDraft(latest, product.productType) : {},
    files: (latest?.files ?? []).map((file) => ({
      id: file.id,
      kind: file.kind,
      fileName: file.fileName,
      sizeBytes: file.sizeBytes,
      url: publicFileUrl(file.kind, file.r2Key),
    })),
    founderRemainingSales: founderRemainingSales(product.seller),
  }
}

function founderRemainingSales(seller: {
  isFounder: boolean
  founderWaivedSalesCount: number
}) {
  if (!seller.isFounder) return 0
  const startsAt = env.FOUNDER_PROGRAM_STARTS_AT
    ? new Date(env.FOUNDER_PROGRAM_STARTS_AT)
    : undefined
  const status = founderStatus(seller, new Date(), startsAt)
  // janela de 90 dias encerrada: não sobra venda isenta
  return status.daysLeft === 0 ? 0 : status.remainingSales
}
