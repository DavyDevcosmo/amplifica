'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MARKET_NAV } from './navItems'

// Menu do cabeçalho em telas sem espaço para a navegação (abaixo de lg).
export function MobileNavMenu({ className }: { className?: string }) {
  const t = useTranslations('nav')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('openMenu')}
        className={cn(
          'flex size-11 flex-col items-end justify-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      >
        <span aria-hidden className="block h-0.5 w-6.5 rounded-full bg-foreground" />
        <span aria-hidden className="block h-0.5 w-4.5 rounded-full bg-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          {MARKET_NAV.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className="min-h-11"
            >
              {t(item.key)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/login" />} className="min-h-11">
            {t('signIn')}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/signup" />}
            className="min-h-11 font-semibold text-primary"
          >
            {t('signUp')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
