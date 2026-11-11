'use client'

import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@/schemas/productSchema'

// "Antes de enviar": os três itens que liberam o envio para análise.
export function SubmitChecklist({
  items,
  free,
}: {
  items: ChecklistItem[]
  free: boolean
}) {
  const t = useTranslations('seller.productForm.checklist')

  return (
    <section className="flex flex-col gap-3 rounded-card bg-card p-5">
      <h2 className="text-sm font-bold">{t('title')}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className={cn(
                'grid size-5 flex-none place-items-center rounded-full text-white',
                item.ok ? 'bg-azul' : 'bg-ardosia/30',
              )}
            >
              {item.ok ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
            </span>
            <span className={item.ok ? 'text-foreground' : 'text-ardosia'}>
              {item.id === 'price' && free ? t('priceFree') : t(item.id)}
              <span className="sr-only"> ({item.ok ? t('ok') : t('pending')})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
