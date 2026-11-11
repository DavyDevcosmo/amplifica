'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import type { ProductDraftInput } from '@/schemas/productSchema'
import { CARD, FOCUS, H2 } from './formStyles'
import { formPriceBreakdown, suggestionsOf, type WizardStep } from './wizardSteps'

// Etapa 5: resumo com "Editar" levando à etapa de cada linha e o aviso dos
// itens novos sugeridos (vão para a revisão da equipe).
export function StepReview({
  draft,
  deliverableCount,
  hasPreview,
  readOnly,
  onEdit,
}: {
  draft: ProductDraftInput
  deliverableCount: number
  hasPreview: boolean
  readOnly: boolean
  onEdit: (step: WizardStep) => void
}) {
  const t = useTranslations('seller.productForm')
  const locale = useLocale()
  const id = useId()
  const money = (cents: number) => formatCurrency(cents, { locale })
  const empty = t('review.empty')

  const kinds = (draft.kinds ?? [])
    .map((kind) =>
      kind === 'OTHER' && draft.kindOther
        ? draft.kindOther
        : t(`info.kinds.${kind}.label`),
    )
    .join(' + ')
  const styles = [
    ...(draft.styles ?? []),
    ...(draft.styleOther ? [draft.styleOther] : []),
  ]
  const priceCents = draft.priceCents ?? 0
  const price = draft.free
    ? t('review.free')
    : priceCents > 0
      ? t('review.priceValue', {
          price: money(priceCents),
          net: money(formPriceBreakdown(priceCents).netCents),
        })
      : empty

  const rows: { key: string; label: string; value: string; step: WizardStep }[] = [
    { key: 'kind', label: t('review.kind'), value: kinds || empty, step: 1 },
    {
      key: 'name',
      label: t('review.name'),
      value: draft.title?.trim() || empty,
      step: 1,
    },
    {
      key: 'style',
      label: t('review.style'),
      value: styles.join(', ') || empty,
      step: 2,
    },
    {
      key: 'files',
      label: t('review.files'),
      value: t('review.filesValue', {
        count: deliverableCount,
        preview: hasPreview ? 'yes' : 'no',
      }),
      step: 3,
    },
    { key: 'price', label: t('review.price'), value: price, step: 4 },
  ]
  const suggestions = suggestionsOf(draft)

  return (
    <section className={CARD} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={H2}>
        {t('review.title')}
      </h2>
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-ardosia/15 py-3 text-sm md:grid-cols-[minmax(120px,180px)_minmax(0,1fr)_auto] md:gap-3"
          >
            <dt className="font-semibold text-ardosia">{row.label}</dt>
            <dd className="order-3 col-span-full leading-5 break-words md:order-none md:col-span-1">
              {row.value}
            </dd>
            {!readOnly ? (
              <button
                type="button"
                aria-label={t('review.editLabel', { field: row.label })}
                onClick={() => onEdit(row.step)}
                className={cn(
                  'inline-flex min-h-10 items-center justify-self-end rounded-full px-3 type-label text-marinho hover:bg-marinho/6 dark:text-foreground',
                  FOCUS,
                )}
              >
                {t('review.edit')}
              </button>
            ) : null}
          </div>
        ))}
      </dl>
      {suggestions.length > 0 ? (
        <p className="rounded-xl bg-areia/16 px-3.5 py-3 text-[0.8125rem] leading-[1.1875rem] text-taupe dark:text-creme">
          {t('review.suggestions', { items: suggestions.join(', ') })}
        </p>
      ) : null}
    </section>
  )
}
