import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProductWizard } from '@/components/seller/productForm/ProductWizard'
import { parseStep } from '@/components/seller/productForm/wizardSteps'
import { r2ProductsEnabled } from '@/lib/env'
import { getProductForEdit } from '@/server/queries/productQueries'
import { requireSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.productForm')
  return { title: t('metaEdit') }
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ etapa?: string | string[] }>
}) {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { seller } = await requireSeller()
  const [{ id }, { etapa }] = await Promise.all([params, searchParams])

  // Produto de outro vendedor, arquivado ou inexistente: 404 sem vazar nada.
  const product = await getProductForEdit(seller.id, id)
  if (!product) notFound()

  return (
    <ProductWizard
      initial={product}
      step={parseStep(etapa)}
      uploadsEnabled={r2ProductsEnabled}
    />
  )
}
