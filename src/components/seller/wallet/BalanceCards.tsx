import { useLocale, useTranslations } from 'next-intl'
import { formatBrasiliaLongDate } from '@/lib/brasiliaTime'
import { cn, formatCurrency } from '@/lib/utils'

// Mesmo formato de `WalletSummary` (walletService), declarado aqui para o
// componente não importar código de servidor.
export type BalanceSummary = {
  availableCents: number
  heldCents: number
  heldCount: number
  nextReleaseAt: Date | null
  receivedCents: number
  transferredCents: number
}

const valueClass =
  'font-display text-[1.75rem] leading-[1.1] tabular-nums md:text-[2rem]'
const noteClass = 'text-sm leading-[1.3125rem]'

// Três cartões do topo da Carteira: disponível (fundo noite), retido e total
// recebido. Não há botão de saque: o saldo disponível vai para a conta Stripe.
export function BalanceCards({ summary }: { summary: BalanceSummary }) {
  const t = useTranslations('seller.wallet.cards')
  const locale = useLocale()
  const money = (cents: number) => formatCurrency(cents, { locale })

  const heldNote = [
    t('held.note', { count: summary.heldCount }),
    summary.nextReleaseAt
      ? t('held.next', { date: formatBrasiliaLongDate(summary.nextReleaseAt, locale) })
      : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section
        aria-labelledby="wallet-available-title"
        className="flex min-w-0 flex-col gap-3.5 rounded-card bg-noite bg-[radial-gradient(70%_120%_at_100%_0%,rgb(37_99_235/0.35)_0%,rgb(37_99_235/0)_70%)] p-7 text-white"
      >
        <h2 id="wallet-available-title" className="type-eyebrow text-celeste">
          {t('available.label')}
        </h2>
        <span className={cn(valueClass, 'md:text-[2.375rem]')}>
          {money(summary.availableCents)}
        </span>
        <p className={cn(noteClass, 'text-nevoa')}>{t('available.note')}</p>
      </section>

      <section
        aria-labelledby="wallet-held-title"
        className="flex min-w-0 flex-col gap-3.5 rounded-card bg-card p-6"
      >
        <h2 id="wallet-held-title" className="type-eyebrow text-ardosia">
          {t('held.label')}
        </h2>
        <span className={cn(valueClass, 'text-azul-forte dark:text-azul-claro')}>
          {money(summary.heldCents)}
        </span>
        <p className={cn(noteClass, 'text-ardosia')}>{heldNote}</p>
      </section>

      <section
        aria-labelledby="wallet-received-title"
        className="flex min-w-0 flex-col gap-3.5 rounded-card bg-card p-6"
      >
        <h2 id="wallet-received-title" className="type-eyebrow text-ardosia">
          {t('received.label')}
        </h2>
        <span className={valueClass}>{money(summary.receivedCents)}</span>
        <p className={cn(noteClass, 'text-ardosia')}>
          {t('received.note', { amount: money(summary.transferredCents) })}
        </p>
      </section>
    </div>
  )
}
