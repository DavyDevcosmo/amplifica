import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { HeaderPreferences } from '@/components/layout/HeaderPreferences'
import { UserMenu } from '@/components/layout/UserMenu'
import { buttonVariants } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

// Cabeçalho da loja, compartilhado pelas áreas pública e do cliente. Lê a
// sessão aqui (getSession é deduplicado por request): depois de uma action
// que muda o usuário, um router.refresh() já traz o nome novo pra cá.
export async function StoreHeader() {
  const session = await getSession()
  const t = await getTranslations('nav')

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        Amplifica
      </Link>
      <div className="flex items-center gap-1">
        <HeaderPreferences />
        {session ? (
          // só o que o UserMenu precisa — o objeto de sessão inteiro tem
          // role/status/id/emailVerified, que não tem por que ir pro client
          <UserMenu
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            {/* Link de navegação de verdade — não usa o componente Button
              (Base UI força role="button" nele mesmo com render={<Link/>},
              o que quebra a semântica de link e a acessibilidade). */}
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              {t('signIn')}
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
              {t('signUp')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
