import Link from 'next/link'
import type { ReactNode } from 'react'
import { UserMenu } from '@/components/layout/UserMenu'
import { buttonVariants } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-medium"
        >
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Amplifica
        </Link>
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
              Entrar
            </Link>
            <Link href="/cadastro" className={cn(buttonVariants({ size: 'sm' }))}>
              Criar conta
            </Link>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
