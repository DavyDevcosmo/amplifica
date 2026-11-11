import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ProductList } from '@/components/seller/products/ProductList'
import { ProductSearch } from '@/components/seller/products/ProductSearch'
import {
  countByStatus,
  filterProducts,
  firstParam,
  parseSituacao,
  searchProducts,
} from '@/components/seller/products/productListFilter'
import { StatusFilter } from '@/components/seller/products/StatusFilter'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import { getSellerProducts } from '@/server/queries/productQueries'
import { requireSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.products')
  return { title: t('meta') }
}

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string | string[]; q?: string | string[] }>
}) {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { seller } = await requireSeller()

  const [{ situacao: situacaoParam, q }, t] = await Promise.all([
    searchParams,
    getTranslations('seller.products'),
  ])
  const situacao = parseSituacao(firstParam(situacaoParam))
  const query = firstParam(q)?.trim() ?? ''

  const products = await getSellerProducts(seller.id)
  // As contagens das pílulas seguem a busca, para bater com o que a lista mostra.
  const searched = searchProducts(products, query)
  const visible = filterProducts(searched, situacao)

  return (
    <div className="flex flex-col gap-6">
      <SellerPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        action={
          <Link
            href="/seller/products/new"
            className="type-label inline-flex min-h-11 items-center rounded-full bg-azul px-5 text-white outline-none hover:bg-azul-forte focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2"
          >
            {t('newProduct')}
          </Link>
        }
      />

      {products.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter
            counts={countByStatus(searched)}
            current={situacao}
            query={query}
          />
          <ProductSearch defaultValue={query} />
        </div>
      ) : null}

      <ProductList products={visible} hasAny={products.length > 0} />

      <p className="text-[0.8125rem] leading-5 text-ardosia">{t('note')}</p>
    </div>
  )
}
