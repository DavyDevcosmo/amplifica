'use client'

import { ChevronLeftIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { LogoMark } from '@/components/layout/Logo'
import { FounderSeal } from '@/components/product/FounderSeal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import { isSellerNavActive, SELLER_NAV } from './sellerNav'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-azul-claro'

// Barra lateral fixa (264px) da área do vendedor em telas lg+. O item ativo
// vem do pathname; a Carteira mostra quanto ainda está retido.
export function SellerSidebar({
  name,
  image,
  isFounder,
  heldCents,
  className,
}: {
  name: string
  image: string | null
  isFounder: boolean
  heldCents: number
  className?: string
}) {
  const t = useTranslations('seller')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'sticky top-0 h-dvh w-66 shrink-0 flex-col gap-7 overflow-y-auto bg-noite px-4 py-6 text-white',
        className,
      )}
    >
      <Link
        href="/seller"
        aria-label={t('shell.homeLabel')}
        className={cn('flex min-h-11 items-center gap-2.5 rounded-lg px-2', focusRing)}
      >
        <LogoMark inverse className="h-[26px]" />
        <span className="font-display text-lg uppercase">Amplifica</span>
      </Link>

      <Link
        href="/seller/profile"
        aria-label={t('shell.profileCard')}
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-celeste/20 bg-noite-3 p-3 hover:bg-noite-3/80',
          focusRing,
        )}
      >
        <span className="relative shrink-0">
          <Avatar
            className="size-11 border-[1.5px] border-celeste after:hidden"
            aria-hidden
          >
            {image ? <AvatarImage src={image} alt="" /> : null}
            <AvatarFallback className="bg-marinho text-sm font-bold text-white">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          {isFounder ? (
            <FounderSeal className="absolute -right-1.5 -bottom-1 size-5" />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-sm leading-5">{name}</strong>
          <span className="text-xs leading-4 text-areia">
            {isFounder ? t('shell.founder') : t('shell.seller')}
          </span>
        </span>
      </Link>

      <Link
        href="/seller/products/new"
        className={cn(
          'type-label flex min-h-12 items-center justify-center gap-2 rounded-full bg-azul text-white hover:bg-azul-forte',
          focusRing,
        )}
      >
        <PlusIcon aria-hidden className="size-4" strokeWidth={2.2} />
        {t('shell.newProduct')}
      </Link>

      <nav aria-label={t('nav.label')}>
        <ul className="flex flex-col gap-1">
          {SELLER_NAV.map(({ id, href, icon: Icon, labelKey }) => {
            const active = isSellerNavActive(pathname, href)
            return (
              <li key={id}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold hover:bg-white/6',
                    focusRing,
                    active ? 'bg-azul/28 text-white' : 'text-nevoa',
                  )}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={1.8} />
                  <span className="grow">{t(`nav.${labelKey}`)}</span>
                  {id === 'wallet' && heldCents > 0 ? (
                    <span className="rounded-full bg-areia/18 px-2 py-0.5 text-[0.6875rem] font-bold text-areia">
                      {t('shell.held', {
                        amount: formatCurrency(heldCents, { locale, wholeReais: true }),
                      })}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-celeste/20 pt-5">
        <Link
          href="/"
          className={cn(
            'flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-nevoa hover:bg-white/6',
            focusRing,
          )}
        >
          <ChevronLeftIcon aria-hidden className="size-[18px]" strokeWidth={1.8} />
          {t('shell.backToStore')}
        </Link>
      </div>
    </aside>
  )
}
