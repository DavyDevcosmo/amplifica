import { useLocale, useTranslations } from 'next-intl'
import { StatusBadge, type StatusBadgeState } from '@/components/seller/StatusBadge'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrasiliaShortDate } from '@/lib/brasiliaTime'
import { cn, formatCurrency } from '@/lib/utils'

// Linha do extrato já pronta para exibir. Valores em centavos: `grossCents` e
// `netCents` vêm com sinal (reembolso e transferência são negativos).
// `productTitle` só vale para venda e reembolso; a transferência usa o texto
// das mensagens.
export type StatementTableRow = {
  id: string
  date: Date
  kind: 'sale' | 'refund' | 'transfer'
  productTitle: string
  grossCents: number
  commissionCents: number | null
  processingCents: number | null
  netCents: number
  exempt: boolean
  state: StatusBadgeState
}

const headClass =
  'px-3 py-2.5 text-xs font-semibold tracking-widest text-ardosia uppercase first:pl-6 last:pr-6'
const cellClass = 'px-3 py-3.5 first:pl-6 last:pr-6'

// Extrato da carteira. O contêiner rola na horizontal e é alcançável pelo
// teclado. Sem linhas, mostra o aviso no lugar da tabela.
export function Statement({
  rows,
  filtered,
}: {
  rows: StatementTableRow[]
  filtered: boolean
}) {
  const t = useTranslations('seller.wallet.statement')
  const locale = useLocale()

  const money = (cents: number) => formatCurrency(cents, { locale })
  // "− R$ 10,19" para valores negativos; "—" quando o desconto não se aplica.
  const signed = (cents: number) => (cents < 0 ? `− ${money(-cents)}` : money(cents))
  const deduction = (cents: number | null) => (cents ? `− ${money(cents)}` : '—')

  if (rows.length === 0) {
    return (
      <p className="px-6 pt-4 pb-8 text-[0.9375rem] leading-[1.375rem] text-ardosia">
        {filtered ? t('emptyFiltered') : t('emptyAll')}
      </p>
    )
  }

  return (
    // <section> com nome já é a região (role implícito)
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: região rolável precisa ser alcançável pelo teclado
      tabIndex={0}
      aria-label={t('region')}
      className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-azul"
    >
      <table
        data-slot="table"
        className="w-full min-w-[820px] border-collapse text-sm tabular-nums"
      >
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="text-left hover:bg-transparent">
            <TableHead scope="col" className={headClass}>
              {t('date')}
            </TableHead>
            <TableHead scope="col" className={headClass}>
              {t('movement')}
            </TableHead>
            <TableHead scope="col" className={cn(headClass, 'text-right')}>
              {t('amount')}
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
            const movement =
              row.kind === 'transfer'
                ? t('transfer')
                : t(row.kind, { product: row.productTitle })
            return (
              <TableRow key={row.id} className="border-t border-ardosia/15 border-b-0">
                <TableCell className={cn(cellClass, 'whitespace-nowrap text-ardosia')}>
                  {formatBrasiliaShortDate(row.date, locale)}
                </TableCell>
                <TableCell className={cn(cellClass, 'font-semibold')}>
                  {movement}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right')}>
                  {signed(row.grossCents)}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right text-ardosia')}>
                  {row.kind === 'sale' && row.exempt
                    ? t('exempt')
                    : deduction(row.commissionCents)}
                </TableCell>
                <TableCell className={cn(cellClass, 'text-right text-ardosia')}>
                  {deduction(row.processingCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    cellClass,
                    'text-right font-bold',
                    row.netCents < 0 && 'text-destructive-strong',
                  )}
                >
                  {signed(row.netCents)}
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
