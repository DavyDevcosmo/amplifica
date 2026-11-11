'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import type { ProductDraftInput } from '@/schemas/productSchema'

const MAX_TAGS = 4

// Prévia do card da loja enquanto o vendedor preenche. Mesmas classes do
// `ProductCard` da vitrine, sem links (o produto ainda não tem página).
export function StorePreviewCard({
  draft,
  coverUrl,
}: {
  draft: ProductDraftInput
  coverUrl: string | null
}) {
  const t = useTranslations('seller.productForm')
  const locale = useLocale()
  const free = draft.free ?? false
  const kinds = (draft.kinds ?? [])
    .map((kind) =>
      kind === 'OTHER' && draft.kindOther
        ? draft.kindOther
        : t(`info.kinds.${kind}.label`),
    )
    .join(' + ')
  const tags = [
    ...(draft.styles ?? []),
    ...(draft.styleOther ? [draft.styleOther] : []),
  ].slice(0, MAX_TAGS)

  return (
    <div className="flex flex-col gap-3">
      <p className="type-eyebrow text-ardosia">{t('preview.eyebrow')}</p>
      <article className="overflow-hidden rounded-card border border-ardosia/25 bg-white text-preto">
        <div className="relative mx-2 mt-2 aspect-16/10 overflow-hidden rounded-cover bg-linear-135 from-ardosia to-celeste">
          {coverUrl ? (
            // biome-ignore lint/performance/noImgElement: capa vem do bucket público do R2, sem otimização do Next
            <img src={coverUrl} alt="" className="size-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 px-4.5 pt-4 pb-4.5">
          <p className="text-[0.6875rem] leading-4 font-semibold tracking-[0.16em] text-ardosia uppercase">
            {kinds || t('preview.kindPlaceholder')}
          </p>
          <h3 className="font-display text-[1.0625rem] leading-[1.375rem] font-semibold break-words">
            {draft.title?.trim() || t('preview.titlePlaceholder')}
          </h3>
          {tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-creme px-2.5 py-0.75 text-[0.6875rem] font-semibold text-marinho"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-ardosia">
            {draft.shortDescription?.trim() || t('preview.descriptionPlaceholder')}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="font-display text-[1.1875rem] leading-6 whitespace-nowrap uppercase tabular-nums">
              {free
                ? t('preview.free')
                : formatCurrency(draft.priceCents ?? 0, { locale })}
            </span>
            <span className="inline-flex min-h-10 items-center rounded-full bg-azul px-4 text-[0.6875rem] leading-4 font-bold tracking-[0.12em] text-white uppercase">
              {free ? t('preview.download') : t('preview.buy')}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
