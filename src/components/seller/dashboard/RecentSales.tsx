import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { StatusBadge, type StatusBadgeState } from '@/components/seller/StatusBadge'
import { formatBrasiliaShortDate } from '@/lib/brasiliaTime'
import { formatCurrency } from '@/lib/utils'

export type RecentSaleRow = {
  id: string
  title: string
  createdAt: Date
  priceCents: number
  netCents: number
  state: StatusBadgeState
}

const headClass = 'px-3 py-2.5 font-semibold first:pl-6 last:pr-6'
const cellClass = 'px-3 py-3.5 first:pl-6 last:pr-6'

// Últimas vendas do painel. A tabela rola na horizontal em telas estreitas.
export function RecentSales({ rows }: { rows: RecentSaleRow[] }) {
  const t = useTranslations('seller.dashboard.recent')
  const locale = useLocale()

  return (
    <section
      aria-labelledby="recent-sales-title"
      className="flex flex-col gap-3 rounded-card bg-card"
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-1">
        <h2
          id="recent-sales-title"
          className="font-sans text-base font-bold normal-case [font-stretch:100%]"
        >
          {t('title')}
        </h2>
        <Link
          href="/seller/sales"
          className="type-label inline-flex min-h-11 items-center rounded-full text-azul outline-none hover:underline focus-visible:ring-2 focus-visible:ring-azul dark:text-azul-claro"
        >
          {t('viewAll')}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 pb-6 text-sm leading-5 text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-widest text-muted-foreground uppercase">
                <th scope="col" className={headClass}>
                  {t('product')}
                </th>
                <th scope="col" className={headClass}>
                  {t('date')}
                </th>
                <th scope="col" className={`${headClass} text-right`}>
                  {t('price')}
                </th>
                <th scope="col" className={`${headClass} text-right`}>
                  {t('net')}
                </th>
                <th scope="col" className={headClass}>
                  {t('status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border/30">
                  <td className={`${cellClass} font-semibold`}>{row.title}</td>
                  <td
                    className={`${cellClass} whitespace-nowrap text-muted-foreground`}
                  >
                    {formatBrasiliaShortDate(row.createdAt, locale)}
                  </td>
                  <td className={`${cellClass} text-right tabular-nums`}>
                    {formatCurrency(row.priceCents, { locale })}
                  </td>
                  <td className={`${cellClass} text-right font-bold tabular-nums`}>
                    {formatCurrency(row.netCents, { locale })}
                  </td>
                  <td className={cellClass}>
                    <StatusBadge state={row.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
