'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import {
  COMMISSION_PERCENT,
  parseBrlToCents,
  SELLER_RULES,
} from '@/components/seller/sellerEarnings'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn, formatCurrency } from '@/lib/utils'
import { MAX_PRICE_CENTS } from '@/schemas/productSchema'
import { CARD, FIELD, H2, HELP, INPUT, LABEL } from './formStyles'
import { centsToInput, formPriceBreakdown } from './wizardSteps'

export type PriceValue = { priceCents: number; free: boolean }

// Etapa 4: preço em reais (texto livre, convertido para centavos) ou
// gratuito, com a conta de quanto o vendedor recebe por venda.
export function StepPrice({
  priceCents,
  free,
  founderRemainingSales,
  onChange,
  disabled = false,
}: PriceValue & {
  founderRemainingSales: number
  onChange: (value: PriceValue) => void
  disabled?: boolean
}) {
  const t = useTranslations('seller.productForm.price')
  const locale = useLocale()
  const id = useId()
  const [text, setText] = useState(() => centsToInput(priceCents))

  const parsed = parseBrlToCents(text)
  const checked = !free && text.trim() !== ''
  const invalid = checked && parsed === null
  const tooLow = checked && parsed !== null && parsed < SELLER_RULES.minPriceCents
  const tooHigh = checked && parsed !== null && parsed > MAX_PRICE_CENTS
  const priceError = invalid
    ? t('errorInvalid')
    : tooLow
      ? t('error')
      : tooHigh
        ? t('errorTooHigh')
        : null
  const hasError = priceError !== null
  const shownCents = free ? 0 : (parsed ?? 0)
  const breakdown = formPriceBreakdown(shownCents)
  const money = (cents: number) => formatCurrency(cents, { locale })

  const inputId = `${id}-price`
  const helpId = `${id}-help`
  const switchLabelId = `${id}-free`

  function changeText(value: string) {
    setText(value)
    onChange({ priceCents: parseBrlToCents(value) ?? 0, free })
  }

  return (
    <section className={CARD} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={H2}>
        {t('title')}
      </h2>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className={FIELD}>
            <label htmlFor={inputId} className={LABEL}>
              {t('label')}
            </label>
            <span className="relative flex items-center">
              <span
                aria-hidden
                className="pointer-events-none absolute left-4 font-semibold text-ardosia"
              >
                R$
              </span>
              <Input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={free ? '0,00' : text}
                onChange={(event) => changeText(event.target.value)}
                disabled={disabled || free}
                aria-invalid={hasError}
                aria-describedby={helpId}
                className={cn(
                  INPUT,
                  'pl-12 tabular-nums',
                  hasError && 'border-destructive aria-invalid:ring-0',
                )}
              />
            </span>
            <p
              id={helpId}
              className={cn(HELP, hasError && 'font-semibold text-destructive-strong')}
            >
              {free ? t('freeHelp') : (priceError ?? t('help'))}
            </p>
          </div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: o Switch do Base UI fica dentro do label */}
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 self-start text-sm font-semibold">
            <Switch
              checked={free}
              disabled={disabled}
              aria-labelledby={switchLabelId}
              onCheckedChange={(checked) =>
                onChange({ priceCents: parseBrlToCents(text) ?? 0, free: checked })
              }
            />
            <span id={switchLabelId}>{t('free')}</span>
          </label>
        </div>

        <div className="flex flex-col gap-2 rounded-tile bg-background p-5 text-sm tabular-nums">
          <dl aria-label={t('breakdown')} className="flex flex-col gap-2">
            <Row label={t('gross')} value={money(breakdown.grossCents)} />
            <Row
              label={t('commission', { percent: COMMISSION_PERCENT })}
              value={t('deduction', { amount: money(breakdown.commissionCents) })}
            />
            <Row
              label={t('processing')}
              value={t('deduction', { amount: money(breakdown.processingCents) })}
            />
            <div className="flex items-baseline justify-between gap-3 border-t border-ardosia/25 pt-2.5 font-bold">
              <dt>{t('net')}</dt>
              <dd className="font-display text-xl text-azul-forte dark:text-azul-claro">
                {money(breakdown.netCents)}
              </dd>
            </div>
          </dl>
          {founderRemainingSales > 0 && !free ? (
            <p className="mt-1 text-[0.8125rem] leading-[1.1875rem] text-taupe dark:text-areia">
              {t('founder', {
                count: founderRemainingSales,
                amount: money(breakdown.founderNetCents),
              })}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ardosia">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
