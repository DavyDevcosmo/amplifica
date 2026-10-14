import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { AccountNav } from '@/components/account/AccountNav'

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('account')

  return (
    <div className="mx-auto w-full max-w-280 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-2 pb-7">
        <h1 className="text-[2rem] leading-tight font-bold">{t('title')}</h1>
        <p className="text-base text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <AccountNav />
        <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
      </div>
    </div>
  )
}
