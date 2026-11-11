import { cn } from '@/lib/utils'

export type KpiTone = 'default' | 'held' | 'available' | 'danger' | 'accent'

export type KpiItem = {
  label: string
  value: string
  note: string
  tone?: KpiTone
}

const VALUE_TONES: Record<KpiTone, string> = {
  default: 'text-foreground',
  held: 'text-azul-forte dark:text-azul-claro',
  available: 'text-success',
  danger: 'text-destructive-strong',
  accent: 'text-azul-forte dark:text-azul-claro',
}

// Cartões de números do topo das telas do vendedor (Painel, Vendas, Carteira).
// Recebe tudo já formatado; quem chama decide os textos.
export function KpiGrid({ items, label }: { items: KpiItem[]; label?: string }) {
  return (
    <section aria-label={label}>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-col gap-2.5 rounded-card bg-card p-4 lg:p-5"
          >
            <dt className="text-[0.8125rem] leading-[1.125rem] font-semibold text-muted-foreground">
              {item.label}
            </dt>
            <dd
              className={cn(
                'font-display text-xl leading-none tabular-nums lg:text-[1.625rem]',
                VALUE_TONES[item.tone ?? 'default'],
              )}
            >
              {item.value}
            </dd>
            <dd className="text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
              {item.note}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
