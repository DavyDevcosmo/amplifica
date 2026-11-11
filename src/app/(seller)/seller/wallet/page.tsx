import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import { BalanceCards } from '@/components/seller/wallet/BalanceCards'
import { Releases } from '@/components/seller/wallet/Releases'
import { Statement, type StatementTableRow } from '@/components/seller/wallet/Statement'
import { StatementFilter } from '@/components/seller/wallet/StatementFilter'
import {
  filterStatement,
  parseWalletFilter,
} from '@/components/seller/wallet/walletFilter'
import { getSellerItems } from '@/server/queries/salesQueries'
import { requireSeller } from '@/server/queries/sellerQueries'
import { itemState } from '@/server/services/salesReport'
import {
  buildStatement,
  type StatementRow,
  upcomingReleases,
  walletSummary,
} from '@/server/services/walletService'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.wallet')
  return { title: t('meta') }
}

export default async function SellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string | string[] }>
}) {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { seller } = await requireSeller()

  const [{ filtro }, t] = await Promise.all([
    searchParams,
    getTranslations('seller.wallet'),
  ])
  const filter = parseWalletFilter(filtro)
  const now = new Date()

  // A carteira soma todas as vendas do vendedor, sem recorte de mês.
  const items = await getSellerItems(seller.id)
  const itemsById = new Map(items.map((item) => [item.id, item]))

  const summary = walletSummary(items, now)
  const releases = upcomingReleases(items, now, 4)

  // Venda retida precisa da data de liberação para a etiqueta de situação.
  function rowState(row: StatementRow): StatementTableRow['state'] {
    if (row.state === 'held') {
      const item = itemsById.get(row.id.replace(/^sale-/, ''))
      const state = item ? itemState(item, now) : null
      return state?.kind === 'held' ? state : { kind: 'available' }
    }
    return row.state === 'available' || row.state === 'refunded'
      ? { kind: row.state }
      : row.state
  }

  const rows: StatementTableRow[] = filterStatement(
    buildStatement(items, now),
    filter,
  ).map((row) => ({
    id: row.id,
    date: row.date,
    kind: row.kind,
    // O título do serviço da transferência é fixo em pt-BR: a tabela usa a mensagem.
    productTitle: row.kind === 'transfer' ? '' : row.title,
    grossCents: row.grossCents,
    commissionCents: row.commissionCents,
    processingCents: row.processingCents,
    netCents: row.netCents,
    exempt: row.exempt,
    state: rowState(row),
  }))

  return (
    <div className="flex flex-col gap-6">
      <SellerPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('lead')}
      />

      <BalanceCards
        summary={{
          availableCents: summary.availableCents,
          heldCents: summary.heldCents,
          heldCount: summary.heldCount,
          nextReleaseAt: summary.nextReleaseAt,
          receivedCents: summary.receivedCents,
          transferredCents: summary.transferredCents,
        }}
      />

      <Releases
        releases={releases.map((release) => ({
          dayKey: release.dayKey,
          date: release.date,
          amountCents: release.amountCents,
          count: release.count,
        }))}
      />

      <section
        aria-labelledby="wallet-statement-title"
        className="flex flex-col rounded-card bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-2">
          <h2
            id="wallet-statement-title"
            className="font-sans text-base font-bold normal-case [font-stretch:100%]"
          >
            {t('statement.title')}
          </h2>
          <StatementFilter current={filter} />
        </div>
        <Statement rows={rows} filtered={filter !== 'all'} />
      </section>
    </div>
  )
}
