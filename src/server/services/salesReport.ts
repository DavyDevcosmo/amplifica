import 'server-only'
import { saleBreakdown } from '@/components/seller/sellerEarnings'
import { dayOfMonth, daysInMonth, type MonthKey, monthKeyOf } from '@/lib/brasiliaTime'

// Funções puras (sem banco, sem Date.now()): quem chama passa o "agora".
// Tudo que as telas de painel, vendas e carteira mostram sai daqui.

export type SaleItem = {
  id: string
  orderId: string
  productId: string
  productTitle: string
  priceCents: number
  platformFeeCents: number
  status: 'PAID' | 'REFUNDED'
  createdAt: Date
  availableAt: Date
  transferredAt: Date | null
  refund: {
    amountCents: number
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
    processedAt: Date | null
  } | null
}

export type ItemState =
  | { kind: 'held'; until: Date }
  | { kind: 'available' }
  | { kind: 'refunded' }

export function itemState(item: SaleItem, now: Date): ItemState {
  if (item.status === 'REFUNDED') return { kind: 'refunded' }
  if (item.availableAt.getTime() > now.getTime()) {
    return { kind: 'held', until: item.availableAt }
  }
  return { kind: 'available' }
}

// Situação mostrada ao vendedor: igual a `itemState`, mais 'transferred' para
// a venda paga cujo saldo já foi enviado à conta Stripe.
export function saleStatus(item: SaleItem, now: Date): ItemState | 'transferred' {
  return item.status === 'PAID' && item.transferredAt !== null
    ? 'transferred'
    : itemState(item, now)
}

// Identificador curto do pedido para o vendedor — não revela o comprador.
export function orderLabel(orderId: string): string {
  return `#${orderId.slice(-6).toUpperCase()}`
}

export type MonthSummary = {
  salesCount: number
  grossCents: number
  commissionCents: number
  processingCents: number
  refundsCents: number
  refundsCount: number
  netCents: number
}

// Espera só os itens do mês. Venda válida = PAID; reembolso = REFUNDED
// (soma o preço, que é o que volta ao comprador).
export function summarizeMonth(items: SaleItem[]): MonthSummary {
  const summary: MonthSummary = {
    salesCount: 0,
    grossCents: 0,
    commissionCents: 0,
    processingCents: 0,
    refundsCents: 0,
    refundsCount: 0,
    netCents: 0,
  }
  for (const item of items) {
    if (item.status === 'REFUNDED') {
      summary.refundsCount += 1
      summary.refundsCents += item.priceCents
      continue
    }
    const sale = saleBreakdown(item)
    summary.salesCount += 1
    summary.grossCents += sale.grossCents
    summary.commissionCents += sale.commissionCents
    summary.processingCents += sale.processingCents
    summary.netCents += sale.netCents
  }
  return summary
}

export type DayPoint = {
  day: number
  future: boolean
  byProduct: { productId: string; count: number; netCents: number }[]
}

// Um ponto por dia do mês (dia de Brasília). `future` = depois de hoje.
export function dailySeries(items: SaleItem[], month: MonthKey, now: Date): DayPoint[] {
  const currentMonth = monthKeyOf(now)
  const today = dayOfMonth(now)

  const points: DayPoint[] = Array.from({ length: daysInMonth(month) }, (_, index) => {
    const day = index + 1
    const future = month > currentMonth || (month === currentMonth && day > today)
    return { day, future, byProduct: [] }
  })

  for (const item of items) {
    if (item.status !== 'PAID' || monthKeyOf(item.createdAt) !== month) continue
    const point = points[dayOfMonth(item.createdAt) - 1]
    if (!point) continue
    const { netCents } = saleBreakdown(item)
    const entry = point.byProduct.find((p) => p.productId === item.productId)
    if (entry) {
      entry.count += 1
      entry.netCents += netCents
    } else {
      point.byProduct.push({ productId: item.productId, count: 1, netCents })
    }
  }
  return points
}

export type ProductTotal = {
  productId: string
  title: string
  count: number
  netCents: number
}

// Vendas válidas (PAID) agrupadas por produto, maior líquido primeiro.
export function totalsByProduct(items: SaleItem[]): ProductTotal[] {
  const totals = new Map<string, ProductTotal>()
  for (const item of items) {
    if (item.status !== 'PAID') continue
    const { netCents } = saleBreakdown(item)
    const entry = totals.get(item.productId)
    if (entry) {
      entry.count += 1
      entry.netCents += netCents
    } else {
      totals.set(item.productId, {
        productId: item.productId,
        title: item.productTitle,
        count: 1,
        netCents,
      })
    }
  }
  return [...totals.values()].sort((a, b) => b.netCents - a.netCents)
}
