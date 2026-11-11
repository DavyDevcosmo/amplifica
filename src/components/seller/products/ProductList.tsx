import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { SellerProductRow } from '@/server/queries/productQueries'
import { ProductRow } from './ProductRow'

// Cartão da lista "Meus produtos". `hasAny` é falso quando o vendedor ainda
// não tem produto nenhum (convite para criar o primeiro); com produtos mas
// nenhum no filtro/busca, mostra só o aviso.
export function ProductList({
  products,
  hasAny = true,
}: {
  products: SellerProductRow[]
  hasAny?: boolean
}) {
  const t = useTranslations('seller.products')

  return (
    <section
      aria-label={t('list.region')}
      className="overflow-hidden rounded-card bg-card"
    >
      {products.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {products.map((product, index) => (
            <ProductRow key={product.id} product={product} index={index} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
          <p className="font-display text-lg">{t('empty.title')}</p>
          <p className="max-w-[42ch] text-[0.9375rem] leading-[1.375rem] text-ardosia">
            {hasAny ? t('empty.text') : t('empty.noneText')}
          </p>
          {hasAny ? null : (
            <Link
              href="/seller/products/new"
              className="type-label mt-2 inline-flex min-h-11 items-center rounded-full bg-azul px-5 text-white outline-none hover:bg-azul-forte focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2"
            >
              {t('empty.cta')}
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
