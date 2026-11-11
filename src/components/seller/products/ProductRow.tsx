import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ProductStatusBadge } from '@/components/seller/ProductStatusBadge'
import { cn, formatCurrency } from '@/lib/utils'
import type { SellerProductRow } from '@/server/queries/productQueries'

// Capas sem imagem alternam entre três degradês da paleta.
const COVER_GRADIENTS = [
  'bg-linear-135 from-ardosia to-celeste',
  'bg-linear-135 from-marinho to-azul',
  'bg-linear-135 from-noite to-ardosia',
] as const

const AREA = {
  cover: '[grid-area:cover]',
  info: '[grid-area:info]',
  badge: '[grid-area:badge]',
  reason: '[grid-area:reason]',
  stats: '[grid-area:stats]',
  price: 'md:[grid-area:price]',
  sales: 'md:[grid-area:sales]',
  action: '[grid-area:action]',
} as const

// Uma linha da lista "Meus produtos". Um componente só: cartão no celular e
// linha de colunas de `md` para cima, com as mesmas peças reposicionadas por
// áreas do grid (nada duplicado no DOM).
export function ProductRow({
  product,
  index = 0,
}: {
  product: SellerProductRow
  index?: number
}) {
  const t = useTranslations('seller.products')
  const locale = useLocale()

  const kindLabel = (kind: SellerProductRow['kinds'][number]) =>
    kind === 'OTHER' && product.kindOther ? product.kindOther : t(`kind.${kind}`)
  const meta = [product.kinds.map(kindLabel).join(' + '), product.capturedAmp || null]
    .filter(Boolean)
    .join(' · ')

  const firstKind = product.kinds[0]
  const price =
    product.priceCents === 0
      ? t('list.free')
      : formatCurrency(product.priceCents, { locale })
  const sales = product.status === 'published' ? String(product.salesCount) : '—'

  return (
    <li
      className={cn(
        'grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3.5 border-t border-ardosia/15 p-4 first:border-t-0',
        "[grid-template-areas:'cover_info'_'cover_badge'_'reason_reason'_'stats_stats'_'action_action']",
        'md:grid-cols-[5.5rem_minmax(0,1fr)_6.875rem_5.625rem_8.75rem_auto] md:items-center md:gap-x-5 md:px-6 md:py-[1.125rem]',
        "md:[grid-template-areas:'cover_info_price_sales_badge_action'_'._reason_reason_reason_reason_reason']",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          AREA.cover,
          'grid size-14 place-items-center self-start overflow-hidden rounded-cover font-display text-[0.8125rem] text-white/90 md:h-14 md:w-22 md:self-center md:rounded-tile md:text-sm',
          !product.coverUrl && COVER_GRADIENTS[index % COVER_GRADIENTS.length],
        )}
      >
        {product.coverUrl ? (
          // biome-ignore lint/performance/noImgElement: capa vem do bucket público do R2, sem otimização do Next
          <img src={product.coverUrl} alt="" className="size-full object-cover" />
        ) : firstKind ? (
          t(`kindShort.${firstKind}`)
        ) : null}
      </span>

      <div className={cn(AREA.info, 'flex min-w-0 flex-col gap-1.5 md:gap-1')}>
        <strong className="text-base leading-[1.375rem] font-bold">
          {product.title}
        </strong>
        <span className="text-[0.8125rem] leading-[1.125rem] text-ardosia">{meta}</span>
      </div>

      <ProductStatusBadge
        status={product.status}
        className={cn(AREA.badge, 'mt-1.5 self-start justify-self-start md:mt-0')}
      />

      {product.status === 'rejected' && product.rejectionReason ? (
        <p
          className={cn(
            AREA.reason,
            'mt-3.5 rounded-xl bg-destructive/7 px-3 py-2.5 text-[0.8125rem] leading-[1.1875rem] text-destructive-strong md:mt-1 md:max-w-[70ch] md:rounded-none md:bg-transparent md:p-0',
          )}
        >
          {t('list.reason', { reason: product.rejectionReason })}
        </p>
      ) : null}

      <dl
        className={cn(
          AREA.stats,
          'mt-3.5 grid grid-cols-2 rounded-cover bg-background md:contents',
        )}
      >
        <div className={cn(AREA.price, 'flex flex-col gap-0.5 px-3.5 py-2.5 md:p-0')}>
          <dt className="text-xs leading-4 text-ardosia">{t('list.price')}</dt>
          <dd className="m-0 text-base font-bold tabular-nums md:text-[0.9375rem]">
            {price}
          </dd>
        </div>
        <div
          className={cn(
            AREA.sales,
            'flex flex-col gap-0.5 border-l border-ardosia/20 px-3.5 py-2.5 md:border-l-0 md:p-0',
          )}
        >
          <dt className="text-xs leading-4 text-ardosia">{t('list.sales')}</dt>
          <dd className="m-0 text-base font-bold tabular-nums md:text-[0.9375rem]">
            {sales}
          </dd>
        </div>
      </dl>

      <Link
        href={`/seller/products/${product.id}/edit`}
        className={cn(
          AREA.action,
          'mt-3.5 inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-marinho/30 px-3 text-[0.8125rem] font-semibold text-marinho outline-none hover:bg-marinho/5 focus-visible:ring-2 focus-visible:ring-azul md:mt-0 md:justify-self-end md:border-transparent dark:text-foreground',
        )}
      >
        {t(`action.${product.status}`)}
      </Link>
    </li>
  )
}
