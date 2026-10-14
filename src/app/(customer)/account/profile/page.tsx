import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AccountSection } from '@/components/account/AccountSection'
import { ProfileForm } from '@/components/account/ProfileForm'
import { SignOutButton } from '@/components/account/SignOutButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { requireUser } from '@/lib/auth'
import { getInitials } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.profile')
  return { title: t('meta') }
}

export default async function ProfilePage() {
  const t = await getTranslations('account.profile')
  const user = await requireUser('/account/profile')

  return (
    <AccountSection id="profile" title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-22 after:hidden" aria-hidden>
            <AvatarFallback className="bg-primary font-heading text-[2rem] font-bold text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-base font-bold">{user.name}</span>
        </div>
        <ProfileForm name={user.name} email={user.email} />
        <Separator />
        <SignOutButton />
      </div>
    </AccountSection>
  )
}
