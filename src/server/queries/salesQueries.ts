import 'server-only'
import { prisma } from '@/lib/prisma'
import type { SaleItem } from '@/server/services/salesReport'

// Só pedidos que chegaram a ser pagos (PENDING, FAILED e CANCELED nunca viram
// venda). Item REFUNDED continua aparecendo para o extrato e o resumo.
const SOLD_ORDER_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const

const itemSelect = {
  id: true,
  orderId: true,
  productId: true,
  priceCents: true,
  platformFeeCents: true,
  status: true,
  createdAt: true,
  availableAt: true,
  transferredAt: true,
  product: { select: { title: true } },
  refund: { select: { amountCents: true, status: true, processedAt: true } },
} as const

function toSaleItem(row: {
  id: string
  orderId: string
  productId: string
  priceCents: number
  platformFeeCents: number
  status: 'PAID' | 'REFUNDED'
  createdAt: Date
  availableAt: Date
  transferredAt: Date | null
  product: { title: string }
  refund: SaleItem['refund']
}): SaleItem {
  const { product, ...item } = row
  return { ...item, productTitle: product.title }
}

// `range.end` é exclusivo (ver monthBounds). Filtra pela data da venda.
export async function getSellerItems(
  sellerId: string,
  range?: { start: Date; end: Date },
): Promise<SaleItem[]> {
  const rows = await prisma.orderItem.findMany({
    where: {
      sellerId,
      order: { status: { in: [...SOLD_ORDER_STATUSES] } },
      ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}),
    },
    select: itemSelect,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toSaleItem)
}

export async function getFirstSaleDate(sellerId: string): Promise<Date | null> {
  const first = await prisma.orderItem.findFirst({
    where: { sellerId, order: { status: { in: [...SOLD_ORDER_STATUSES] } } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  })
  return first?.createdAt ?? null
}

export async function getRecentItems(sellerId: string, take = 5): Promise<SaleItem[]> {
  const rows = await prisma.orderItem.findMany({
    where: { sellerId, order: { status: { in: [...SOLD_ORDER_STATUSES] } } },
    select: itemSelect,
    orderBy: { createdAt: 'desc' },
    take,
  })
  return rows.map(toSaleItem)
}
