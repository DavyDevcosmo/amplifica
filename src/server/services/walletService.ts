import 'server-only'
import { saleBreakdown } from '@/components/seller/sellerEarnings'
import { brasiliaDayKey } from '@/lib/brasiliaTime'
import { itemState, type SaleItem } from './salesReport'

// Carteira do vendedor: funções puras sobre os itens vendidos. Quem chama
// passa o "agora" — nada aqui lê o relógio.

export type WalletSummary = {
  availableCents: number
  heldCents: number
  heldCount: number
  nextReleaseAt: Date | null
  receivedCents: number
  transferredCents: number
}

export function walletSummary(items: SaleItem[], now: Date): WalletSummary {
  const wallet: WalletSummary = {
    availableCents: 0,
    heldCents: 0,
    heldCount: 0,
    nextReleaseAt: null,
    receivedCents: 0,
    transferredCents: 0,
  }
  for (const item of items) {
    if (item.status !== 'PAID') continue
    const { netCents } = saleBreakdown(item)
    wallet.receivedCents += netCents
    if (item.transferredAt !== null) {
      wallet.transferredCents += netCents
      continue
    }
    const state = itemState(item, now)
    if (state.kind === 'available') {
      wallet.availableCents += netCents
    } else if (state.kind === 'held') {
      wallet.heldCents += netCents
      wallet.heldCount += 1
      if (!wallet.nextReleaseAt || state.until < wallet.nextReleaseAt) {
        wallet.nextReleaseAt = state.until
      }
    }
  }
  return wallet
}

export type Release = {
  dayKey: string
  date: Date
  amountCents: number
  count: number
}

// Próximas liberações de saldo retido, agrupadas por dia de Brasília.
export function upcomingReleases(items: SaleItem[], now: Date, limit = 4): Release[] {
  const byDay = new Map<string, Release>()
  for (const item of items) {
    if (item.status !== 'PAID' || item.transferredAt !== null) continue
    if (itemState(item, now).kind !== 'held') continue
    const dayKey = brasiliaDayKey(item.availableAt)
    const { netCents } = saleBreakdown(item)
    const release = byDay.get(dayKey)
    if (release) {
      release.amountCents += netCents
      release.count += 1
      if (item.availableAt < release.date) release.date = item.availableAt
    } else {
      byDay.set(dayKey, {
        dayKey,
        date: item.availableAt,
        amountCents: netCents,
        count: 1,
      })
    }
  }
  return [...byDay.values()]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(0, limit)
}

export type StatementKind = 'sale' | 'refund' | 'transfer'

export type StatementRow = {
  id: string
  date: Date
  kind: StatementKind
  title: string
  grossCents: number
  commissionCents: number | null
  processingCents: number | null
  netCents: number
  state: 'held' | 'available' | 'refunded' | 'transferred'
  exempt: boolean
}

const TRANSFER_TITLE = 'Transferência para sua conta Stripe'

// Extrato em ordem de data decrescente: uma linha por venda, uma por reembolso
// concluído (reverte o líquido da venda) e uma por dia de transferência.
export function buildStatement(items: SaleItem[], now: Date): StatementRow[] {
  const rows: StatementRow[] = []
  const transfers = new Map<string, { date: Date; netCents: number }>()

  for (const item of items) {
    const sale = saleBreakdown(item)
    const state = itemState(item, now)

    rows.push({
      id: `sale-${item.id}`,
      date: item.createdAt,
      kind: 'sale',
      title: item.productTitle,
      grossCents: sale.grossCents,
      commissionCents: sale.commissionCents,
      processingCents: sale.processingCents,
      netCents: sale.netCents,
      state:
        item.transferredAt !== null && item.status === 'PAID'
          ? 'transferred'
          : state.kind,
      exempt: sale.exempt,
    })

    if (item.refund?.status === 'SUCCEEDED' && item.refund.processedAt) {
      rows.push({
        id: `refund-${item.id}`,
        date: item.refund.processedAt,
        kind: 'refund',
        title: item.productTitle,
        grossCents: -item.refund.amountCents,
        commissionCents: null,
        processingCents: null,
        netCents: -sale.netCents,
        state: 'refunded',
        exempt: sale.exempt,
      })
    }

    if (item.status === 'PAID' && item.transferredAt !== null) {
      const dayKey = brasiliaDayKey(item.transferredAt)
      const transfer = transfers.get(dayKey)
      if (transfer) {
        transfer.netCents += sale.netCents
        if (item.transferredAt > transfer.date) transfer.date = item.transferredAt
      } else {
        transfers.set(dayKey, { date: item.transferredAt, netCents: sale.netCents })
      }
    }
  }

  for (const [dayKey, transfer] of transfers) {
    rows.push({
      id: `transfer-${dayKey}`,
      date: transfer.date,
      kind: 'transfer',
      title: TRANSFER_TITLE,
      grossCents: -transfer.netCents,
      commissionCents: null,
      processingCents: null,
      netCents: -transfer.netCents,
      state: 'transferred',
      exempt: false,
    })
  }

  return rows.sort((a, b) => b.date.getTime() - a.date.getTime())
}
