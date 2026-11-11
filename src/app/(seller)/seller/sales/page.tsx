import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { KpiGrid } from '@/components/seller/KpiGrid'
import { MonthPicker } from '@/components/seller/sales/MonthPicker'
import { ProductFilter } from '@/components/seller/sales/ProductFilter'
import { SalesChart } from '@/components/seller/sales/SalesChart'
import { SalesTable } from '@/components/seller/sales/SalesTable'
import { ALL_PRODUCTS, productColor } from '@/components/seller/sales/salesConstants'
import { saleBreakdown } from '@/components/seller/sellerEarnings'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import {
  currentMonthKey,
  monthBounds,
  monthKeyOf,
  monthLabel,
  monthsBetween,
  monthTitle,
  parseMonthKey,
  shiftMonth,
} from '@/lib/brasiliaTime'
import { formatCurrency } from '@/lib/utils'
import { getFirstSaleDate, getSellerItems } from '@/server/queries/salesQueries'
import { requireSeller } from '@/server/queries/sellerQueries'
import {
  dailySeries,
  orderLabel,
  saleStatus,
  summarizeMonth,
  totalsByProduct,
} from '@/server/services/salesReport'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.sales')
  return { title: t('meta') }
}

export default async function SellerSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; produto?: string }>
}) {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { seller } = await requireSeller()

  const [{ mes, produto }, t, locale] = await Promise.all([
    searchParams,
    getTranslations('seller.sales'),
    getLocale(),
  ])
  const now = new Date()
  const current = currentMonthKey(now)
  const month = parseMonthKey(mes, now)

  // Meses navegáveis: do primeiro mês com venda até o atual. Sem nenhuma venda
  // (ou com um mês antigo na URL) o seletor ainda inclui o mês aberto.
  const firstSale = await getFirstSaleDate(seller.id)
  const firstMonth = firstSale ? monthKeyOf(firstSale) : current
  const months = monthsBetween(month < firstMonth ? month : firstMonth, current)

  const [monthItems, previousItems] = await Promise.all([
    getSellerItems(seller.id, monthBounds(month)),
    month > firstMonth
      ? getSellerItems(seller.id, monthBounds(shiftMonth(month, -1)))
      : Promise.resolve([]),
  ])

  const summary = summarizeMonth(monthItems)
  const diff = summary.salesCount - summarizeMonth(previousItems).salesCount
  const money = (cents: number) => formatCurrency(cents, { locale })

  const totals = totalsByProduct(monthItems)
  const chartProducts = totals.map((total, index) => ({
    id: total.productId,
    title: total.title,
    color: productColor(index),
  }))

  // Filtro: produtos com qualquer item no mês (inclui só-reembolsados).
  const filterOptions = [
    ...new Map(monthItems.map((item) => [item.productId, item.productTitle])),
  ].map(([id, title]) => ({ id, title }))
  const selectedProduct = filterOptions.some((option) => option.id === produto)
    ? (produto as string)
    : ALL_PRODUCTS

  const rows = monthItems
    .filter(
      (item) => selectedProduct === ALL_PRODUCTS || item.productId === selectedProduct,
    )
    .map((item) => {
      const sale = saleBreakdown(item)
      return {
        id: item.id,
        createdAt: item.createdAt,
        order: orderLabel(item.orderId),
        title: item.productTitle,
        priceCents: item.priceCents,
        commissionCents: sale.commissionCents,
        exempt: sale.exempt,
        processingCents: sale.processingCents,
        netCents: sale.netCents,
        state: saleStatus(item, now),
      }
    })

  const salesNote =
    month === firstMonth && firstSale
      ? t('kpi.salesFirst')
      : diff === 0
        ? t('kpi.salesSame')
        : t(diff > 0 ? 'kpi.salesMore' : 'kpi.salesLess', { count: Math.abs(diff) })

  return (
    <div className="flex flex-col gap-6">
      <SellerPageHeader
        eyebrow={t('eyebrow')}
        title={monthTitle(month, locale)}
        action={<MonthPicker month={month} months={months} current={current} />}
      />

      <KpiGrid
        label={t('kpi.label')}
        items={[
          { label: t('kpi.sales'), value: String(summary.salesCount), note: salesNote },
          {
            label: t('kpi.gross'),
            value: money(summary.grossCents),
            note: t('kpi.grossNote'),
          },
          {
            label: t('kpi.refunds'),
            value: money(summary.refundsCents),
            note: t('kpi.refundsNote', { count: summary.refundsCount }),
            tone: summary.refundsCents > 0 ? 'danger' : 'default',
          },
          {
            label: t('kpi.net'),
            value: money(summary.netCents),
            note: t('kpi.netNote'),
            tone: 'accent',
          },
        ]}
      />

      {monthItems.length === 0 ? (
        <section className="flex flex-col items-center gap-2.5 rounded-card bg-card px-6 py-14 text-center">
          <p className="font-display text-lg">{t('empty.title')}</p>
          <p className="max-w-[46ch] text-[0.9375rem] leading-[1.375rem] text-ardosia">
            {t('empty.text')}
          </p>
        </section>
      ) : (
        <>
          <SalesChart
            key={month}
            days={dailySeries(monthItems, month, now)}
            products={chartProducts}
            monthLabel={monthLabel(month, locale)}
          />

          <section aria-labelledby="sales-list-title" className="rounded-card bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-2">
              <h2
                id="sales-list-title"
                className="font-sans text-base font-bold normal-case [font-stretch:100%]"
              >
                {t('list.title')}{' '}
                <span className="font-normal text-ardosia">({rows.length})</span>
              </h2>
              <ProductFilter
                month={month}
                options={filterOptions}
                value={selectedProduct}
              />
            </div>
            <SalesTable rows={rows} />
          </section>
        </>
      )}
    </div>
  )
}
