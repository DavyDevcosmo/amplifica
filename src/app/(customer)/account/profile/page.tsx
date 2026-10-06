import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { ProfileForm } from '@/components/account/ProfileForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { hasCredentialAccount } from '@/server/queries/userQueries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('meta') }
}

export default async function ProfilePage() {
  const t = await getTranslations('account')
  const user = await requireUser('/account/profile')
  const canChangePassword = await hasCredentialAccount(user.id)

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profileCard')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload user={{ name: user.name, image: user.image }} />
          <ProfileForm name={user.name} />
        </CardContent>
      </Card>

      {canChangePassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('passwordCard')}</CardTitle>
            <CardDescription>{t('passwordCardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
