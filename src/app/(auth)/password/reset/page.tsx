import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('reset') }
}

// Sem searchParams: o e-mail vem do fluxo (store) e o código é digitado aqui.
export default async function ResetPasswordPage() {
  const t = await getTranslations('auth.reset')

  return (
    <div className="flex flex-col gap-(--auth-section-gap)">
      <AuthHeading title={t('title')} description={t('description')} />
      <ResetPasswordForm />
    </div>
  )
}
