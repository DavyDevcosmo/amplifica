import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { ResetCodeForm } from '@/components/auth/ResetCodeForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('resetCode') }
}

// Sem searchParams: o e-mail vem do fluxo (store) e o código é digitado aqui.
export default async function ResetCodePage() {
  const t = await getTranslations('auth.resetCode')

  return (
    <div className="flex flex-col gap-(--auth-section-gap)">
      <AuthHeading title={t('title')} description={t('description')} />
      <ResetCodeForm />
    </div>
  )
}
