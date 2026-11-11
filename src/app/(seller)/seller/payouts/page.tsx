import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SellerPageHeader } from '@/components/seller/shell/SellerPageHeader'
import { Button } from '@/components/ui/button'
import { requireSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.payouts')
  return { title: t('meta') }
}

export default async function SellerPayoutsPage() {
  // O guard do layout não roda de novo em navegação no client: confere aqui.
  const { seller } = await requireSeller()

  const [t, tBanner] = await Promise.all([
    getTranslations('seller.payouts'),
    getTranslations('seller.dashboard.banner'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <SellerPageHeader eyebrow={t('eyebrow')} title={t('title')} />

      <section
        aria-labelledby="payouts-status-title"
        className="flex flex-col gap-5 rounded-card bg-card p-6 sm:p-8"
      >
        <h2 id="payouts-status-title" className="type-eyebrow text-ardosia">
          {t('cardLabel')}
        </h2>
        <p className="font-display text-[1.75rem] leading-[1.1] md:text-[2rem]">
          {t(`status.${seller.stripeAccountStatus}`)}
        </p>
        <p className="text-sm leading-[1.3125rem] text-ardosia">{tBanner('body')}</p>

        <div className="flex flex-col gap-2">
          <Button size="lg" disabled aria-describedby="payouts-connect-note">
            {t('connect')}
          </Button>
          <p
            id="payouts-connect-note"
            className="text-sm leading-[1.3125rem] text-ardosia"
          >
            {t('connectNote')}
          </p>
        </div>
      </section>
    </div>
  )
}
