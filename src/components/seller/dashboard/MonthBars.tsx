import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

// Mesmo formato de `DayPoint` (salesReport), declarado aqui para o componente
// não importar código de servidor.
export type MonthBarsPoint = {
  day: number
  future: boolean
  byProduct: { count: number }[]
}

function salesOf(point: MonthBarsPoint) {
  return point.byProduct.reduce((sum, product) => sum + product.count, 0)
}

// Barras de vendas por dia, do dia 1 até hoje. Hoje em azul, dias com venda em
// celeste, dias vazios em cinza. O gráfico é uma imagem para leitor de tela:
// o `aria-label` resume o pico.
export function MonthBars({
  points,
  month,
  startLabel,
}: {
  points: MonthBarsPoint[]
  month: string
  startLabel: string
}) {
  const t = useTranslations('seller.dashboard.chart')
  const days = points.filter((point) => !point.future)
  const counts = days.map(salesOf)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const peak = Math.max(0, ...counts)

  return (
    <section
      aria-labelledby="month-bars-title"
      className="flex flex-col gap-4 rounded-card bg-card p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="month-bars-title"
          className="font-sans text-base font-bold normal-case [font-stretch:100%]"
        >
          {t('title', { month })}
        </h2>
        <span className="text-[0.8125rem] text-muted-foreground">
          {t('count', { count: total })}
        </span>
      </div>
      <div
        role="img"
        aria-label={peak > 0 ? t('label', { month, peak }) : t('labelEmpty', { month })}
        className="flex h-30 items-end gap-1.5"
      >
        {days.map((point, index) => {
          const count = counts[index]
          return (
            <span
              key={point.day}
              className={cn(
                'min-w-1.5 flex-1 rounded-t-md rounded-b-xs',
                index === days.length - 1
                  ? 'bg-azul'
                  : count > 0
                    ? 'bg-celeste'
                    : 'bg-ardosia/20',
              )}
              style={{
                height: `${Math.max(4, Math.round((count / Math.max(peak, 1)) * 100))}%`,
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{startLabel}</span>
        <span>{t('today')}</span>
      </div>
    </section>
  )
}
