import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthBackLink } from '@/components/auth/AuthBackLink'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('forgot') }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth.forgot')

  return (
    // pt-11: reserva o espaço do link de voltar, ancorado no canto do cartão
    <div className="flex flex-col gap-(--auth-section-gap) pt-11">
      <AuthBackLink />
      <AuthHeading title={t('title')} description={t('description')} />
      <ForgotPasswordForm />
    </div>
  )
}
