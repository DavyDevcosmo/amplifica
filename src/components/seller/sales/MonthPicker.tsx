'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { type MonthKey, monthTitle, shiftMonth } from '@/lib/brasiliaTime'

const arrowClass =
  'inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-marinho/30 bg-field text-marinho outline-none hover:bg-marinho/5 focus-visible:ring-2 focus-visible:ring-azul disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-field dark:text-foreground'

// Seletor de mês da tela de Vendas. O mês vive na URL (`?mes=2026-10`), então
// a navegação reabre a página no servidor; produto volta a "todos".
// `months` vem em ordem crescente; `current` é o mês de hoje em Brasília.
export function MonthPicker({
  month,
  months,
  current,
}: {
  month: MonthKey
  months: MonthKey[]
  current: MonthKey
}) {
  const t = useTranslations('seller.sales.month')
  const locale = useLocale()
  const router = useRouter()
  const selectId = useId()

  const goTo = (key: MonthKey) => router.push(`?mes=${key}`)
  const oldest = months[0] ?? month

  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
      <legend className="sr-only">{t('group')}</legend>
      <button
        type="button"
        aria-label={t('previous')}
        disabled={month <= oldest}
        onClick={() => goTo(shiftMonth(month, -1))}
        className={arrowClass}
      >
        <ChevronLeft className="size-[18px]" aria-hidden="true" />
      </button>
      <label htmlFor={selectId} className="sr-only">
        {t('select')}
      </label>
      <NativeSelect
        id={selectId}
        value={month}
        onChange={(event) => goTo(event.target.value as MonthKey)}
      >
        {[...months].reverse().map((key) => (
          <NativeSelectOption key={key} value={key}>
            {monthTitle(key, locale)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <button
        type="button"
        aria-label={t('next')}
        disabled={month >= current}
        onClick={() => goTo(shiftMonth(month, 1))}
        className={arrowClass}
      >
        <ChevronRight className="size-[18px]" aria-hidden="true" />
      </button>
      {month === current ? null : (
        <button
          type="button"
          onClick={() => goTo(current)}
          className="type-label inline-flex min-h-11 items-center rounded-full px-4 text-azul outline-none hover:underline focus-visible:ring-2 focus-visible:ring-azul dark:text-azul-claro"
        >
          {t('current')}
        </button>
      )}
    </fieldset>
  )
}
