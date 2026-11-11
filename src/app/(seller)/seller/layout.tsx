import type { ReactNode } from 'react'
import { SellerMobileHeader } from '@/components/seller/shell/SellerMobileHeader'
import { SellerSidebar } from '@/components/seller/shell/SellerSidebar'
import { getSellerNavSummary, requireSeller } from '@/server/queries/sellerQueries'

// Guard de UX da área do vendedor: sem sessão vai para o login, sem perfil
// para o onboarding (/becomeSeller) e conta suspensa volta para a loja. As
// actions e queries de cada página ainda conferem o dono dos dados.
export default async function SellerLayout({ children }: { children: ReactNode }) {
  const { user, seller } = await requireSeller()
  const { heldCents } = await getSellerNavSummary(seller.id)

  return (
    <div className="flex min-h-dvh flex-col bg-creme lg:flex-row">
      <SellerSidebar
        className="hidden lg:flex"
        name={seller.displayName}
        image={user.image ?? null}
        isFounder={seller.isFounder}
        heldCents={heldCents}
      />
      <SellerMobileHeader className="lg:hidden" />
      <main className="min-w-0 flex-1 px-4 pt-8 pb-14 md:px-8 xl:px-10">
        {children}
      </main>
    </div>
  )
}
