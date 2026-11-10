import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { HeaderPreferences } from '@/components/layout/HeaderPreferences'
import { Logo } from '@/components/layout/Logo'
import { MobileNavMenu } from '@/components/layout/MobileNavMenu'
import { STORE_NAV } from '@/components/layout/navItems'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Cabeçalho das telas de auth: logo, navegação da loja, preferências (tema e
// idioma) e acesso à conta. Abaixo de lg a navegação vira o menu circular e
// as preferências ficam ao lado dele.
export async function AuthHeader() {
  const t = await getTranslations('nav')

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 lg:h-(--auth-header-h) lg:px-10">
      <Link
        href="/"
        aria-label={t('home')}
        className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Logo />
      </Link>

      <nav
        aria-label={t('main')}
        className="hidden gap-1 text-muted-foreground lg:flex"
      >
        {STORE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1 lg:gap-2">
        <HeaderPreferences />
        <div className="hidden items-center gap-2 lg:flex">
          {/* Links de verdade, não o componente Button (mesmo motivo do header da loja). */}
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost', size: 'pill' }))}
          >
            {t('signIn')}
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: 'pill' }))}>
            {t('signUp')}
          </Link>
        </div>
        <MobileNavMenu className="lg:hidden" />
      </div>
    </header>
  )
}
