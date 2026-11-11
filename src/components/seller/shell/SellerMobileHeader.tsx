'use client'

import { HouseIcon, MenuIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'
import { isSellerNavActive, SELLER_NAV } from './sellerNav'

const linkClass =
  'flex items-center gap-3.5 rounded-2xl px-3 font-semibold text-nevoa outline-none hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-azul-claro'

// Cabeçalho da área do vendedor abaixo de lg: logo + hambúrguer. Aberto, o
// menu empurra o conteúdo (não fica sobreposto) e fecha ao trocar de rota
// ou com Escape.
export function SellerMobileHeader({ className }: { className?: string }) {
  const t = useTranslations('seller')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  // Trocou de rota com o menu aberto: fecha (ajuste durante o render, sem efeito).
  if (open && pathname !== openedAt) {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function toggle() {
    setOpenedAt(pathname)
    setOpen((current) => !current)
  }

  return (
    <header className={cn('sticky top-0 z-20 bg-noite text-white', className)}>
      <div className="flex min-h-16 items-center gap-2 py-2.5 pr-2 pl-4">
        <Link
          href="/seller"
          aria-label={t('shell.homeLabel')}
          className="flex min-h-11 grow items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-azul-claro"
        >
          <LogoMark inverse className="h-[22px]" />
          <span className="text-lg font-extrabold tracking-[0.01em]">Amplifica</span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="seller-menu"
          aria-label={open ? t('shell.closeMenu') : t('shell.openMenu')}
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-azul-claro',
            open && 'bg-white/10',
          )}
        >
          {open ? (
            <XIcon aria-hidden className="size-[22px]" />
          ) : (
            <MenuIcon aria-hidden className="size-[22px]" />
          )}
        </button>
      </div>
      {open ? (
        <nav
          id="seller-menu"
          aria-label={t('nav.label')}
          className="border-t border-nevoa/15 px-3 pt-2 pb-4"
        >
          <ul className="flex flex-col gap-0.5">
            {SELLER_NAV.map(({ id, href, icon: Icon, labelKey }) => {
              const active = isSellerNavActive(pathname, href)
              return (
                <li key={id}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      linkClass,
                      'min-h-13 text-base',
                      active && 'bg-azul/35 text-white',
                    )}
                  >
                    <Icon aria-hidden className="size-[22px]" strokeWidth={1.8} />
                    {t(`navMobile.${labelKey}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-2 border-t border-nevoa/15 pt-2">
            <Link href="/" className={cn(linkClass, 'min-h-12 text-sm text-nevoa')}>
              <HouseIcon aria-hidden className="size-5" strokeWidth={1.8} />
              {t('shell.backToStore')}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
