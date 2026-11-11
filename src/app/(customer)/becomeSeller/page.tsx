import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { BecomeSellerForm } from '@/components/seller/BecomeSellerForm'
import { getCurrentSeller } from '@/server/queries/sellerQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seller.becomeSeller')
  return { title: t('meta') }
}

export default async function BecomeSellerPage() {
  // quem já é vendedor não passa pelo onboarding de novo
  if (await getCurrentSeller()) redirect('/seller')

  const t = await getTranslations('seller.becomeSeller')

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-12 md:py-16">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow text-azul">{t('eyebrow')}</p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] text-marinho dark:text-white">
          {t('title')}
        </h1>
        <p className="text-base leading-6 text-muted-foreground">{t('lead')}</p>
      </header>
      <BecomeSellerForm />
    </div>
  )
}
