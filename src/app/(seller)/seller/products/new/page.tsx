import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ProductWizard } from '@/components/seller/productForm/ProductWizard'
import { r2ProductsEnabled } from '@/lib/env'
import { requireSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.productForm')
  return { title: t('metaNew') }
}

// Produto novo: sempre começa na etapa 1 (sem id não há etapa 2+; avançar
// cria o rascunho e leva para /seller/products/{id}/edit).
export default async function NewProductPage() {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  await requireSeller()
  return <ProductWizard initial={null} step={1} uploadsEnabled={r2ProductsEnabled} />
}
