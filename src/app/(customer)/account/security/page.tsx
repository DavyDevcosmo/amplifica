import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AccountSection } from '@/components/account/AccountSection'
import { GoogleAccountStatus } from '@/components/account/GoogleAccountStatus'
import { PasswordForm } from '@/components/account/PasswordForm'
import { requireUser } from '@/lib/auth'
import { googleOAuthEnabled } from '@/lib/env'
import { getLoginMethods } from '@/server/queries/userQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.security')
  return { title: t('meta') }
}

export default async function SecurityPage() {
  const t = await getTranslations('account.security')
  const user = await requireUser('/account/security')
  const { hasPassword, hasGoogle } = await getLoginMethods(user.id)

  return (
    <>
      <AccountSection
        id="password"
        title={hasPassword ? t('password.changeTitle') : t('password.setTitle')}
        description={
          hasPassword ? t('password.changeDescription') : t('password.setDescription')
        }
      >
        <PasswordForm hasPassword={hasPassword} />
      </AccountSection>

      {googleOAuthEnabled && (
        <AccountSection
          id="google"
          title={t('google.title')}
          description={t('google.description')}
        >
          <GoogleAccountStatus linked={hasGoogle} />
        </AccountSection>
      )}
    </>
  )
}
