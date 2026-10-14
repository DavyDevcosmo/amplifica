'use client'

import { ShieldCheckIcon, UserRoundIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/account/profile', key: 'profile', icon: UserRoundIcon },
  { href: '/account/security', key: 'security', icon: ShieldCheckIcon },
] as const

// Menu lateral da conta (abas lado a lado no mobile). A página atual vem do
// pathname e é anunciada com aria-current.
export function AccountNav() {
  const t = useTranslations('nav')
  const tAccount = useTranslations('account')
  const pathname = usePathname()

  return (
    <nav
      aria-label={tAccount('navLabel')}
      className="flex gap-2 md:w-60 md:shrink-0 md:flex-col md:gap-1.5"
    >
      {ITEMS.map(({ href, key, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-12 flex-1 items-center justify-center gap-3 rounded-[0.625rem] px-4 text-[0.9375rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:flex-none md:justify-start',
              active
                ? 'bg-accent font-bold text-accent-foreground'
                : 'font-medium text-foreground hover:bg-muted',
            )}
          >
            <Icon className="size-5" strokeWidth={1.8} aria-hidden />
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
