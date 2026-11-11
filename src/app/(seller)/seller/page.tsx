import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { FounderCard } from '@/components/seller/dashboard/FounderCard'
import { founderStatus } from '@/components/seller/dashboard/founderStatus'
import { MonthBars } from '@/components/seller/dashboard/MonthBars'
import { ReceivingBanner } from '@/components/seller/dashboard/ReceivingBanner'
import { RecentSales } from '@/components/seller/dashboard/RecentSales'
import { StartChecklist } from '@/components/seller/dashboard/StartChecklist'
import { KpiGrid } from '@/components/seller/KpiGrid'
import { SELLER_RULES, saleBreakdown } from '@/components/seller/sellerEarnings'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import {
  currentMonthKey,
  formatBrasiliaShortDate,
  monthBounds,
  monthLabel,
  shiftMonth,
} from '@/lib/brasiliaTime'
import { env } from '@/lib/env'
import { formatCurrency } from '@/lib/utils'
import { getRecentItems, getSellerItems } from '@/server/queries/salesQueries'
import { countSellerProducts, requireSeller } from '@/server/queries/sellerQueries'
import { dailySeries, saleStatus, summarizeMonth } from '@/server/services/salesReport'
import { walletSummary } from '@/server/services/walletService'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.dashboard')
  return { title: t('meta') }
}

export default async function SellerDashboardPage() {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { user, seller } = await requireSeller()

  const [t, locale] = await Promise.all([
    getTranslations('seller.dashboard'),
    getLocale(),
  ])
  const now = new Date()
  const month = currentMonthKey(now)
  const previousMonth = shiftMonth(month, -1)
  const monthName = monthLabel(month, locale)
  const firstName = (user.name ?? '').trim().split(/\s+/)[0] || seller.displayName

  const products = await countSellerProducts(seller.id)
  const isNew = products.total === 0
  const receivingDone = seller.stripeAccountStatus === 'VERIFIED'

  const header = (
    <SellerPageHeader
      eyebrow={t('eyebrow')}
      title={t('greeting', { name: firstName })}
      subtitle={isNew ? t('subtitleNew') : t('subtitleActive', { month: monthName })}
      action={
        <Link
          href="/seller/products/new"
          className="type-label inline-flex min-h-11 items-center rounded-full bg-azul px-5 text-white outline-none hover:bg-azul-forte focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2"
        >
          {t('newProduct')}
        </Link>
      }
    />
  )

  if (isNew) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        {receivingDone ? null : <ReceivingBanner />}
        <StartChecklist
          profileDone={Boolean(seller.bio?.trim())}
          productDone={products.published > 0}
          receivingDone={receivingDone}
        />
      </div>
    )
  }

  // Carteira usa todos os itens (retido/disponível não dependem do mês); o
  // resumo e o gráfico usam só os itens do mês, e o mês anterior serve à
  // comparação de vendas.
  const [allItems, monthItems, previousItems, recentItems] = await Promise.all([
    getSellerItems(seller.id),
    getSellerItems(seller.id, monthBounds(month)),
    getSellerItems(seller.id, monthBounds(previousMonth)),
    getRecentItems(seller.id, 5),
  ])

  const wallet = walletSummary(allItems, now)
  const summary = summarizeMonth(monthItems)
  const previousSales = summarizeMonth(previousItems).salesCount
  const diff = summary.salesCount - previousSales
  const previousName = monthLabel(previousMonth, locale)
  const money = (cents: number) => formatCurrency(cents, { locale })

  const startsAt = env.FOUNDER_PROGRAM_STARTS_AT
    ? new Date(env.FOUNDER_PROGRAM_STARTS_AT)
    : undefined

  return (
    <div className="flex flex-col gap-6">
      {header}
      {receivingDone ? null : <ReceivingBanner />}

      <KpiGrid
        label={t('kpi.label')}
        items={[
          {
            label: t('kpi.sales'),
            value: String(summary.salesCount),
            note:
              diff === 0
                ? t('kpi.salesSame', { month: previousName })
                : t(diff > 0 ? 'kpi.salesMore' : 'kpi.salesLess', {
                    count: Math.abs(diff),
                    month: previousName,
                  }),
          },
          {
            label: t('kpi.net'),
            value: money(summary.netCents),
            note: t('kpi.netNote'),
          },
          {
            label: t('kpi.held'),
            value: money(wallet.heldCents),
            note: t('kpi.heldNote', { days: SELLER_RULES.payoutHoldDays }),
            tone: 'held',
          },
          {
            label: t('kpi.available'),
            value: money(wallet.availableCents),
            note: t('kpi.availableNote'),
            tone: 'available',
          },
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4">
        {seller.isFounder ? (
          <FounderCard status={founderStatus(seller, now, startsAt)} />
        ) : null}
        <MonthBars
          points={dailySeries(monthItems, month, now)}
          month={monthName}
          startLabel={formatBrasiliaShortDate(monthBounds(month).start, locale)}
        />
      </div>

      <RecentSales
        rows={recentItems.map((item) => ({
          id: item.id,
          title: item.productTitle,
          createdAt: item.createdAt,
          priceCents: item.priceCents,
          netCents: saleBreakdown(item).netCents,
          state: saleStatus(item, now),
        }))}
      />
    </div>
  )
}
