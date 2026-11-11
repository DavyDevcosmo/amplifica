'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { MonthKey } from '@/lib/brasiliaTime'
import { ALL_PRODUCTS } from './salesConstants'

// Filtro de produto da lista de vendas. Vive na URL ao lado do mês:
// `?mes=2026-10&produto=<id>`; "Todos" tira o produto da URL.
export function ProductFilter({
  month,
  options,
  value,
}: {
  month: MonthKey
  options: { id: string; title: string }[]
  value: string
}) {
  const t = useTranslations('seller.sales.list')
  const router = useRouter()
  const selectId = useId()

  const onChange = (productId: string) =>
    router.push(
      productId === ALL_PRODUCTS
        ? `?mes=${month}`
        : `?mes=${month}&produto=${encodeURIComponent(productId)}`,
    )

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={selectId} className="text-[0.8125rem] font-semibold text-ardosia">
        {t('filter')}
      </label>
      <NativeSelect
        id={selectId}
        size="sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value={ALL_PRODUCTS}>{t('filterAll')}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
