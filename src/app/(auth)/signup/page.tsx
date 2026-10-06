import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { AuthSwitchPrompt } from '@/components/auth/AuthSwitchPrompt'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SocialSignIn } from '@/components/auth/SocialSignIn'
import { googleOAuthEnabled } from '@/lib/env'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('signUp') }
}

export default async function SignUpPage() {
  const t = await getTranslations('auth.signUp')

  return (
    <div className="flex flex-col gap-(--auth-section-gap)">
      <AuthHeading title={t('title')} description={t('description')} />
      <SignUpForm />
      {googleOAuthEnabled && <SocialSignIn />}
      <AuthSwitchPrompt prompt={t('haveAccount')} href="/login" action={t('signIn')} />
    </div>
  )
}
