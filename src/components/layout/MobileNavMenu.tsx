'use client'

import { MenuIcon } from 'lucide-react'
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
import { STORE_NAV } from './navItems'

// Menu do cabeçalho em telas sem espaço para a navegação (abaixo de lg).
// O botão é um círculo de 44px: branco sobre noite (`onDark`) ou azul
// sobre o painel branco do cabeçalho flutuante.
export function MobileNavMenu({
  signedIn = false,
  onDark = false,
  className,
}: {
  signedIn?: boolean
  onDark?: boolean
  className?: string
}) {
  const t = useTranslations('nav')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('openMenu')}
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2',
          onDark ? 'bg-white text-preto' : 'bg-azul text-white hover:bg-azul-forte',
          className,
        )}
      >
        <MenuIcon aria-hidden className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          {STORE_NAV.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className="min-h-11 type-label"
            >
              {t(item.key)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {signedIn ? (
            <DropdownMenuItem
              render={<Link href="/account/profile" />}
              className="min-h-11 type-label"
            >
              {t('account')}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                render={<Link href="/login" />}
                className="min-h-11 type-label"
              >
                {t('signIn')}
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/signup" />}
                className="min-h-11 type-label"
              >
                {t('signUp')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
