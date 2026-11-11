import { useLocale, useTranslations } from 'next-intl'
import { formatBrasiliaShortDate } from '@/lib/brasiliaTime'
import { cn } from '@/lib/utils'

// Mesmo formato de `ItemState` (salesReport), mais 'transferred' para o item
// cujo saldo já foi enviado à conta Stripe. Declarado aqui para o componente
// não importar código de servidor.
export type StatusBadgeState =
  | { kind: 'held'; until: Date }
  | { kind: 'available' }
  | { kind: 'refunded' }
  | 'transferred'

const TONES = {
  held: 'bg-azul/10 text-azul-forte dark:bg-azul/20 dark:text-azul-claro',
  available: 'bg-success/12 text-success',
  refunded: 'bg-destructive/10 text-destructive-strong',
  transferred: 'bg-muted text-muted-foreground',
} as const

// Situação de uma venda (retida, disponível, reembolsada, transferida).
// Usada no painel, em Vendas e na Carteira.
export function StatusBadge({ state }: { state: StatusBadgeState }) {
  const t = useTranslations('seller.status')
  const locale = useLocale()

  if (typeof state === 'string') {
    return <Badge tone={state}>{t(state)}</Badge>
  }
  if (state.kind === 'held') {
    return (
      <Badge tone="held">
        {t('held', { date: formatBrasiliaShortDate(state.until, locale) })}
      </Badge>
    )
  }
  return <Badge tone={state.kind}>{t(state.kind)}</Badge>
}

function Badge({ tone, children }: { tone: keyof typeof TONES; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.75 text-xs font-bold whitespace-nowrap',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
