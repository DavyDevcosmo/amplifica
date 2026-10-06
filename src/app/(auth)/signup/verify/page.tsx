import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthBackLink } from '@/components/auth/AuthBackLink'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { PendingEmailNotice } from '@/components/auth/PendingEmailNotice'
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('verify') }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; origem?: string }>
}) {
  const t = await getTranslations('auth.verify')
  const { callbackUrl, origem } = await searchParams

  return (
    // pt-11: reserva o espaço do link de voltar, ancorado no canto do cartão
    <div className="flex flex-col gap-(--auth-section-gap) pt-11">
      <AuthBackLink />
      <AuthHeading title={t('title')} description={<PendingEmailNotice />} />
      <VerifyEmailForm callbackUrl={callbackUrl} fromLogin={origem === 'login'} />
    </div>
  )
}
