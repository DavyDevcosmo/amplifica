import { useLocale, useTranslations } from 'next-intl'
import { StatusBadge, type StatusBadgeState } from '@/components/seller/StatusBadge'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrasiliaShortDate, formatBrasiliaTime } from '@/lib/brasiliaTime'
import { cn, formatCurrency } from '@/lib/utils'

export type SalesTableRow = {
  id: string
  createdAt: Date
  order: string
  title: string
  priceCents: number
  commissionCents: number
  exempt: boolean
  processingCents: number
  // Líquido da venda (positivo); a tabela o mostra negativo se reembolsada.
  netCents: number
  state: StatusBadgeState
}

const headClass =
  'px-3 py-2.5 text-xs font-semibold tracking-widest text-ardosia uppercase first:pl-6 last:pr-6'
const cellClass = 'px-3 py-3.5 first:pl-6 last:pr-6'

function isRefunded(state: StatusBadgeState) {
  return typeof state !== 'string' && state.kind === 'refunded'
}

// Extrato do mês. O contêiner rola na horizontal (e, no celular, na vertical
// com o cabeçalho fixo: 5 linhas visíveis) e é alcançável pelo teclado.
export function SalesTable({ rows }: { rows: SalesTableRow[] }) {
  const t = useTranslations('seller.sales.list')
  const locale = useLocale()

  // "− R$ 10,19" para descontos; zero fica sem sinal.
  const deduction = (cents: number) =>
    cents > 0 ? `− ${formatCurrency(cents, { locale })}` : formatCurrency(0, { locale })

  return (
    // <section> com nome já é a região (role implícito)
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: região rolável precisa ser alcançável pelo teclado
      tabIndex={0}
      aria-label={t('region')}
      className="max-h-[318px] overflow-x-auto overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-azul md:max-h-none md:overflow-y-visible"
    >
      <table
        data-slot="table"
        className="w-full min-w-[860px] border-collapse text-sm tabular-nums"
      >
        <TableHeader className="sticky top-0 z-1 bg-card [&_tr]:border-b-0">
          <TableRow className="text-left hover:bg-transparent">
            <TableHead scope="col" className={headClass}>
              {t('date')}
            </TableHead>
            <TableHead scope="col" className={headClass}>
              {t('order')}
            </TableHead>
            <TableHead scope="col" className={headClass}>
              {t('product')}
            </TableHead>
            <TableHead scope="col" className={cn(headClass, 'text-right')}>
              {t('price')}
            </TableHead>
            <TableHead scope="col" className={cn(headClass, 'text-right')}>
              {t('commission')}
            </TableHead>
            <TableHead scope="col" className={cn(headClass, 'text-right')}>
              {t('fee')}
            </TableHead>
            <TableHead scope="col" className={cn(headClass, 'text-right')}>
              {t('net')}
            </TableHead>
            <TableHead scope="col" className={headClass}>
              {t('status')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const refunded = isRefunded(row.state)
            return (
              <TableRow key={row.id} className="border-t border-ardosia/15 border-b-0">
                <TableCell className={cellClass}>
                  {formatBrasiliaShortDate(row.createdAt, locale)}{' '}
                  <span className="text-ardosia">
                    {formatBrasiliaTime(row.createdAt, locale)}
                  </span>
                </TableCell>
                <TableCell className={cn(cellClass, 'text-ardosia')}>
                  {row.order}
                </TableCell>
                <TableCell className={cn(cellClass, 'font-semibold')}>
                  {row.title}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right')}>
                  {formatCurrency(row.priceCents, { locale })}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right text-ardosia')}>
                  {row.exempt ? t('exempt') : deduction(row.commissionCents)}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right text-ardosia')}>
                  {deduction(row.processingCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    cellClass,
                    'text-right font-bold',
                    refunded && 'text-destructive-strong',
                  )}
                >
                  {refunded
                    ? `− ${formatCurrency(row.netCents, { locale })}`
                    : formatCurrency(row.netCents, { locale })}
                </TableCell>
                <TableCell className={cellClass}>
                  <StatusBadge state={row.state} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </table>
    </section>
  )
}
