import { getLocale, getTranslations } from 'next-intl/server'
import { StarRating } from '@/components/product/StarRating'
import type { ProductDetail } from '@/components/product/sampleProducts'

// Faixa de avaliações da página de produto: resumo (média + distribuição) e a
// lista de quem comprou. Sem avaliações, um estado vazio honesto (marketplace
// novo). O formulário de avaliação entra quando existir compra/Entitlement
// pra checar quem pode avaliar.
export async function ProductReviews({
  rating,
  reviews,
}: Pick<ProductDetail, 'rating' | 'reviews'>) {
  const t = await getTranslations('product.reviews')
  const locale = await getLocale()
  const average = rating.average.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return (
    <section
      id="avaliacoes"
      aria-labelledby="avaliacoes-titulo"
      className="scroll-mt-24 bg-background py-18 lg:py-28"
    >
      <div className="mx-auto max-w-340 px-4 lg:px-8">
        <div className="flex max-w-215 flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="avaliacoes-titulo"
              className="font-display text-[1.75rem] leading-none lg:text-4xl"
            >
              {t('title')}
            </h2>
            <span className="text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
              {t('note')}
            </span>
          </div>

          {rating.count === 0 ? (
            <div className="flex flex-col gap-1.5 rounded-card border border-dashed border-border bg-card p-6">
              <span className="font-display text-lg leading-tight">
                {t('emptyTitle')}
              </span>
              <span className="text-[0.9375rem] leading-[1.4375rem] text-muted-foreground">
                {t('empty')}
              </span>
            </div>
          ) : (
            <>
              <div className="grid items-center gap-x-10 gap-y-6 rounded-card bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[2.6875rem] leading-[1.05]">
                    {average}
                  </span>
                  <StarRating rating={rating.average} starClassName="size-4.5" />
                  <span className="text-sm leading-5 text-muted-foreground">
                    {t('summary', { count: rating.count })}
                  </span>
                </div>
                <ul aria-label={t('distribution')} className="flex flex-col gap-2">
                  {rating.distribution.map((amount, index) => {
                    const stars = 5 - index
                    const percent = rating.count
                      ? Math.round((amount / rating.count) * 100)
                      : 0
                    return (
                      <li
                        key={stars}
                        className="grid grid-cols-[3.5rem_minmax(0,1fr)_1.75rem] items-center gap-3 text-[0.8125rem] leading-[1.125rem]"
                      >
                        <span>{t('starRow', { stars })}</span>
                        <span
                          aria-hidden
                          className="h-2 overflow-hidden rounded-full bg-background"
                        >
                          <span
                            className="block h-full rounded-full bg-azul"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="text-right text-muted-foreground tabular-nums">
                          {amount}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <ul className="flex flex-col">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="flex flex-col gap-2 border-t border-border py-5"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <strong className="text-[0.9375rem] leading-5">
                        {review.name}
                      </strong>
                      <span
                        role="img"
                        aria-label={t('starsLabel', { rating: review.rating })}
                      >
                        <StarRating rating={review.rating} starClassName="size-3.5" />
                      </span>
                      <span className="rounded-full border border-azul/35 px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold tracking-[0.08em] text-azul-forte uppercase dark:text-azul-claro">
                        {t('verified')}
                      </span>
                      <span className="text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
                        {review.date} · {review.equipment}
                      </span>
                    </div>
                    <p className="max-w-[64ch] text-[0.9375rem] leading-6">
                      {review.text}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
