import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SellerProfileForm } from '@/components/seller/profile/SellerProfileForm'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import { requireSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.profile')
  return { title: t('meta') }
}

export default async function SellerProfilePage() {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { user, seller } = await requireSeller()
  const t = await getTranslations('seller.profile')

  return (
    <div className="flex flex-col gap-6">
      <SellerPageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('lead')}
      />
      <SellerProfileForm
        initial={{
          displayName: seller.displayName,
          bio: seller.bio ?? '',
          city: seller.city ?? '',
          devices: seller.devices,
          instagram: seller.instagram ?? '',
          youtube: seller.youtube ?? '',
          tiktok: seller.tiktok ?? '',
          spotifyUrl: seller.spotifyUrl ?? '',
          isFounder: seller.isFounder,
          imageUrl: user.image ?? null,
        }}
      />
    </div>
  )
}
