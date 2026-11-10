import { HomeHero } from '@/components/home/HomeHero'
import { SellerBand } from '@/components/home/SellerBand'
import { TrustStrip } from '@/components/home/TrustStrip'
import { StoreHeader } from '@/components/layout/StoreHeader'
import { CatalogSection } from '@/components/product/CatalogSection'
// Dados de exemplo até existir server/queries/productQueries.ts.
import { HOME_PRODUCTS, PEDALBOARD_BRANDS } from '@/components/product/sampleProducts'

export default function Home() {
  return (
    <>
      <StoreHeader variant="floating" />
      <main className="flex-1">
        <HomeHero />
        <TrustStrip />
        <CatalogSection products={HOME_PRODUCTS} brands={PEDALBOARD_BRANDS} />
        <SellerBand />
      </main>
    </>
  )
}
