'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn, formatCurrency } from '@/lib/utils'

// Mesmo formato de `DayPoint` (salesReport), declarado aqui para o componente
// não importar código de servidor.
export type SalesChartDay = {
  day: number
  future: boolean
  byProduct: { productId: string; count: number; netCents: number }[]
}

export type SalesChartProduct = { id: string; title: string; color: string }

type Metric = 'count' | 'net'

const CHART_HEIGHT = 240
const NET_STEP_CENTS = 5000 // marcas do eixo em múltiplos de R$ 50

function metricValue(point: { count: number; netCents: number }, metric: Metric) {
  return metric === 'count' ? point.count : point.netCents
}

function dayTotal(day: SalesChartDay, metric: Metric) {
  return day.byProduct.reduce((sum, entry) => sum + metricValue(entry, metric), 0)
}

// Barras empilhadas por produto, uma por dia. Cada dia é um botão: passar o
// mouse, focar ou tocar mostra o resumo do dia no `role="status"`.
export function SalesChart({
  days,
  products,
  monthLabel,
}: {
  days: SalesChartDay[]
  products: SalesChartProduct[]
  monthLabel: string
}) {
  const t = useTranslations('seller.sales.chart')
  const locale = useLocale()
  const [metric, setMetric] = useState<Metric>('count')
  const [picked, setPicked] = useState<number | null>(null)

  const money = (cents: number) => formatCurrency(cents, { locale })
  const format = (value: number) =>
    metric === 'count' ? t('salesCount', { count: value }) : money(value)

  const totals = days.map((day) => (day.future ? 0 : dayTotal(day, metric)))
  const maxValue = Math.max(1, ...totals)
  const step =
    metric === 'count'
      ? Math.ceil(maxValue / 4)
      : Math.ceil(maxValue / 4 / NET_STEP_CENTS) * NET_STEP_CENTS
  const top = step * 4

  // Padrão: o dia de maior valor (o primeiro, se empatar).
  const peakDay = totals.indexOf(Math.max(...totals)) + 1
  const focusDay = days.find((day) => day.day === (picked ?? peakDay)) ?? days[0]
  const focusProducts = products
    .map((product) => ({
      product,
      entry: focusDay?.byProduct.find((entry) => entry.productId === product.id),
    }))
    .filter(({ entry }) => entry !== undefined)

  const legend = products
    .map((product) => {
      let count = 0
      let netCents = 0
      for (const day of days) {
        const entry = day.byProduct.find((e) => e.productId === product.id)
        count += entry?.count ?? 0
        netCents += entry?.netCents ?? 0
      }
      return { product, count, netCents }
    })
    .filter((item) => item.count > 0)

  const yTicks = [4, 3, 2, 1, 0].map((k) => {
    const value = step * k
    if (metric === 'count') return String(value)
    return formatCurrency(value, { locale, wholeReais: true })
  })

  return (
    <section
      aria-labelledby="sales-chart-title"
      className="flex flex-col gap-4 rounded-card bg-card p-4 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="sales-chart-title"
          className="font-sans text-lg font-bold normal-case [font-stretch:100%]"
        >
          {t('title')}
        </h2>
        <fieldset className="m-0 flex min-w-0 gap-1 rounded-full border-0 bg-background p-1">
          <legend className="sr-only">{t('metricGroup')}</legend>
          {(['count', 'net'] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={metric === id}
              onClick={() => setMetric(id)}
              className={cn(
                'min-h-11 rounded-full px-4 text-[0.8125rem] font-bold outline-none focus-visible:ring-2 focus-visible:ring-azul',
                metric === id ? 'bg-card text-foreground' : 'text-ardosia',
              )}
            >
              {t(id)}
            </button>
          ))}
        </fieldset>
      </div>

      <output className="flex min-h-11 flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-background px-4 py-2.5 text-sm">
        <strong>
          {t('focusTitle', { day: focusDay?.day ?? 1, month: monthLabel })}
        </strong>
        {focusProducts.length === 0 ? (
          <span className="text-muted-foreground">{t('emptyDay')}</span>
        ) : (
          focusProducts.map(({ product, entry }) => (
            <span
              key={product.id}
              className="inline-flex items-center gap-2 text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: product.color }}
              />
              {product.title}: {entry ? format(metricValue(entry, metric)) : null}
            </span>
          ))
        )}
        {focusDay && focusProducts.length > 0 ? (
          <span className="ml-auto font-bold tabular-nums">
            {format(dayTotal(focusDay, metric))}
          </span>
        ) : null}
      </output>

      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-2.5 sm:grid-cols-[4rem_minmax(0,1fr)]">
        <div
          data-testid="y-axis"
          aria-hidden="true"
          className="flex flex-col items-end justify-between text-xs text-ardosia tabular-nums"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((label, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: marcas fixas, a posição é a identidade
              key={index}
              className="leading-none"
              style={{
                transform: `translateY(${index === 0 ? -6 : index === 4 ? 6 : 0}px)`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height: CHART_HEIGHT }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <span
              key={k}
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 border-t',
                k === 0 ? 'border-ardosia/50' : 'border-dashed border-ardosia/20',
              )}
              style={{ bottom: `${k * 25}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-stretch gap-[3px]">
            {days.map((day) => {
              const total = dayTotal(day, metric)
              const segments = products
                .map((product) => ({
                  product,
                  value: metricValue(
                    day.byProduct.find((entry) => entry.productId === product.id) ?? {
                      count: 0,
                      netCents: 0,
                    },
                    metric,
                  ),
                }))
                .filter((segment) => segment.value > 0)
              const focus = () => setPicked(day.day)
              return (
                <button
                  key={day.day}
                  type="button"
                  disabled={day.future}
                  aria-label={
                    day.future
                      ? t('dayFuture', { day: day.day })
                      : t('dayLabel', { day: day.day, value: format(total) })
                  }
                  onMouseEnter={focus}
                  onFocus={focus}
                  onClick={focus}
                  className={cn(
                    'flex min-w-1 flex-1 basis-0 flex-col-reverse rounded p-0 outline-none focus-visible:ring-2 focus-visible:ring-azul',
                    day.day === focusDay?.day && 'bg-azul/10',
                  )}
                >
                  {segments.map((segment, index) => (
                    <span
                      key={segment.product.id}
                      className={cn(
                        'block w-full',
                        index === segments.length - 1 && 'rounded-t',
                      )}
                      style={{
                        height: `${(segment.value / top) * 100}%`,
                        backgroundColor: segment.product.color,
                      }}
                    />
                  ))}
                </button>
              )
            })}
          </div>
        </div>
        <span />
        <div
          aria-hidden="true"
          className="flex gap-[3px] pt-2 text-xs text-ardosia tabular-nums"
        >
          {days.map((day) => (
            <span key={day.day} className="min-w-1 flex-1 basis-0 text-center">
              {day.day === 1 || day.day % 5 === 0 ? day.day : ''}
            </span>
          ))}
        </div>
      </div>

      {legend.length > 0 ? (
        <ul
          aria-label={t('legend')}
          className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12.5rem),1fr))] gap-x-6 gap-y-3 border-t border-ardosia/15 pt-4"
        >
          {legend.map(({ product, count, netCents }) => (
            <li key={product.id} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-1 size-3 flex-none rounded"
                style={{ backgroundColor: product.color }}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-sm leading-5">{product.title}</strong>
                <span className="text-[0.8125rem] leading-[1.125rem] text-ardosia tabular-nums">
                  {t('legendDetail', {
                    sales: t('salesCount', { count }),
                    amount: money(netCents),
                  })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
