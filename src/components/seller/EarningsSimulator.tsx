'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import {
  COMMISSION_PERCENT,
  SELLER_RULES,
  simulateMonthlyEarnings,
} from '@/components/seller/sellerEarnings'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'

const PRICE_RANGE = { min: 10, max: 200 } // em reais inteiros
const SALES_RANGE = { min: 1, max: 200 }

function firstValue(value: number | readonly number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : (value as number)
}

// Simulador da landing de vendedor: preço e vendas por mês em sliders, e o
// líquido estimado depois de comissão (com isenção de Fundador) e
// processamento. A conta é em centavos inteiros (sellerEarnings.ts).
export function EarningsSimulator() {
  const t = useTranslations('sell.simulator')
  const locale = useLocale()
  const founderId = useId()
  const [priceReais, setPriceReais] = useState(49)
  const [sales, setSales] = useState(20)
  const [founder, setFounder] = useState(true)

  const priceCents = priceReais * 100
  const result = simulateMonthlyEarnings({ priceCents, sales, founder })
  const money = (cents: number) => formatCurrency(cents, { locale })

  const rows = [
    {
      key: 'gross',
      label: t('gross', { sales, price: money(priceCents) }),
      value: money(result.grossCents),
    },
    {
      key: 'commission',
      label: founder
        ? t('commissionExempt', {
            percent: COMMISSION_PERCENT,
            exempt: result.exemptSales,
          })
        : t('commission', { percent: COMMISSION_PERCENT }),
      value: `− ${money(result.commissionCents)}`,
    },
    {
      key: 'processing',
      label: t('processing'),
      value: `− ${money(result.processingCents)}`,
    },
  ]

  return (
    <div className="grid gap-x-14 gap-y-8 rounded-[1.75rem] bg-background p-6 lg:grid-cols-2 lg:p-10">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.8125rem] font-bold tracking-[0.14em] uppercase">
              {t('price')}
            </span>
            <span className="font-display text-[1.375rem] leading-none text-azul-forte tabular-nums dark:text-azul-claro">
              {money(priceCents)}
            </span>
          </div>
          <Slider
            thumbLabel={t('price')}
            min={PRICE_RANGE.min}
            max={PRICE_RANGE.max}
            step={1}
            value={priceReais}
            onValueChange={(value) => setPriceReais(firstValue(value))}
            className="py-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {formatCurrency(PRICE_RANGE.min * 100, { locale, wholeReais: true })}
            </span>
            <span>
              {formatCurrency(PRICE_RANGE.max * 100, { locale, wholeReais: true })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.8125rem] font-bold tracking-[0.14em] uppercase">
              {t('sales')}
            </span>
            <span className="font-display text-[1.375rem] leading-none text-azul-forte tabular-nums dark:text-azul-claro">
              {sales}
            </span>
          </div>
          <Slider
            thumbLabel={t('sales')}
            min={SALES_RANGE.min}
            max={SALES_RANGE.max}
            step={1}
            value={sales}
            onValueChange={(value) => setSales(firstValue(value))}
            className="py-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{SALES_RANGE.min}</span>
            <span>{SALES_RANGE.max}</span>
          </div>
        </div>

        <label
          htmlFor={founderId}
          className="inline-flex min-h-11 cursor-pointer items-center gap-3 self-start text-[0.9375rem] leading-5 font-semibold"
        >
          <Switch id={founderId} checked={founder} onCheckedChange={setFounder} />
          {t('founder', { count: SELLER_RULES.founderFreeSales })}
        </label>
      </div>

      <div className="flex flex-col gap-1 rounded-card bg-noite p-7 text-white">
        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex justify-between gap-3 border-b border-celeste/25 py-2.5 text-[0.9375rem] leading-[1.375rem]"
            >
              <dt className="text-nevoa">{row.label}</dt>
              <dd className="tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1 pt-4">
          <span className="type-eyebrow text-celeste">{t('net')}</span>
          <output
            aria-live="polite"
            className="font-display text-[1.9375rem] leading-none text-azul-claro tabular-nums lg:text-[2.75rem]"
          >
            {money(result.netCents)}
          </output>
        </div>
        <p className="mt-2 text-xs leading-[1.125rem] text-celeste">
          {t('disclaimer', { days: SELLER_RULES.payoutHoldDays })}
        </p>
      </div>
    </div>
  )
}
