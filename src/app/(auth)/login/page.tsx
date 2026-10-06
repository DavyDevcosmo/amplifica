import { CircleCheckIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { AuthSwitchPrompt } from '@/components/auth/AuthSwitchPrompt'
import { SignInForm } from '@/components/auth/SignInForm'
import { SocialSignIn } from '@/components/auth/SocialSignIn'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { googleOAuthEnabled } from '@/lib/env'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('signIn') }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; senha?: string }>
}) {
  const t = await getTranslations('auth.signIn')
  const { callbackUrl, senha } = await searchParams

  return (
    <div className="flex flex-col gap-(--auth-section-gap)">
      <AuthHeading title={t('title')} description={t('description')} />
      {senha === 'redefinida' && (
        <Alert variant="success" role="status">
          <CircleCheckIcon aria-hidden />
          <AlertTitle>{t('resetTitle')}</AlertTitle>
          <AlertDescription>{t('resetBody')}</AlertDescription>
        </Alert>
      )}
      <SignInForm callbackUrl={callbackUrl} />
      {googleOAuthEnabled && <SocialSignIn callbackUrl={callbackUrl} />}
      <AuthSwitchPrompt
        prompt={t('noAccount')}
        href="/signup"
        action={t('createAccount')}
      />
    </div>
  )
}
