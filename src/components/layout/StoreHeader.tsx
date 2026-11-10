import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { HeaderPreferences } from '@/components/layout/HeaderPreferences'
import { Logo } from '@/components/layout/Logo'
import { MobileNavMenu } from '@/components/layout/MobileNavMenu'
import { STORE_NAV } from '@/components/layout/navItems'
import { buttonVariants } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navLinkClass =
  'inline-flex min-h-11 items-center rounded-full px-2.5 text-[0.75rem] font-semibold tracking-[0.12em] uppercase outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

// Cabeçalho da loja, compartilhado pelas áreas pública e do cliente. Lê a
// sessão aqui (getSession é deduplicado por request): depois de uma action
// que muda o usuário, um router.refresh() já traz o estado novo pra cá.
//
// `floating`: painel branco flutuando sobre a faixa noite (loja pública:
// home, produto, vender), como na v4.
// `solid`: faixa noite com o logo em branco (área da conta).
export async function StoreHeader({
  variant = 'solid',
}: {
  variant?: 'solid' | 'floating'
}) {
  const session = await getSession()
  const t = await getTranslations('nav')
  const floating = variant === 'floating'
  const signedIn = Boolean(session)

  return (
    <header
      className={cn(
        'sticky top-0 z-20 bg-noite',
        floating ? 'pt-4 pb-3' : 'border-b border-celeste/20 text-white',
      )}
    >
      <div className="mx-auto max-w-340 px-4 lg:px-8">
        <div
          className={cn(
            'flex items-center gap-4',
            floating
              ? 'rounded-card border border-ardosia/12 bg-white py-2.5 pr-3 pl-4 text-preto shadow-float lg:pl-6'
              : 'py-3',
          )}
        >
          <Link
            href="/"
            aria-label={t('home')}
            className={cn(
              'flex min-h-11 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              floating
                ? 'focus-visible:ring-marinho'
                : 'focus-visible:ring-celeste focus-visible:ring-offset-noite',
            )}
          >
            <Logo inverse={!floating} themed={false} />
          </Link>

          <nav
            aria-label={t('main')}
            className={cn(
              'ml-auto hidden items-center gap-1 lg:flex',
              floating ? 'mr-2.5 text-ardosia' : 'mr-auto',
            )}
          >
            {STORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  navLinkClass,
                  floating
                    ? 'hover:text-preto focus-visible:ring-marinho'
                    : 'hover:text-celeste focus-visible:ring-celeste focus-visible:ring-offset-noite',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div
            className={cn('flex items-center gap-1.5', !floating && 'ml-auto lg:ml-0')}
          >
            <HeaderPreferences tone={floating ? 'onLight' : 'onDark'} />
            {/* Link de navegação de verdade — não usa o componente Button
              (Base UI força role="button" nele mesmo com render={<Link/>}). */}
            <Link
              href={signedIn ? '/account/profile' : '/login'}
              className={cn(
                buttonVariants({
                  variant: floating ? 'default' : 'inverse',
                  size: 'pill',
                }),
                'ml-1.5 hidden lg:inline-flex',
              )}
            >
              {signedIn ? t('account') : t('signIn')}
            </Link>
            <MobileNavMenu
              signedIn={signedIn}
              onDark={!floating}
              className="lg:hidden"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
