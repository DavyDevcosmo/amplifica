import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { AuthShowcase } from '@/components/auth/AuthShowcase'
import { AuthHeader } from '@/components/layout/AuthHeader'

// Links do rodapé: as páginas /termos e /privacidade ainda não existem.
const footerLinkClass =
  'inline-flex min-h-6 items-center rounded-sm text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50'

// A tela ocupa no mínimo a viewport (min-h-svh). Se o formulário não couber
// (cadastro em tela baixa, erros, alertas), quem rola é a PÁGINA — o cartão não
// é um container de scroll. Melhor rolar do que espremer os elementos. Os
// espaçamentos encolhem só um pouco por altura de tela (variáveis --auth-* em
// globals.css).
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('footer')

  return (
    <div className="flex min-h-svh flex-col bg-card lg:bg-background lg:px-3 lg:pb-3">
      <AuthHeader />
      <div className="flex flex-1 lg:gap-3">
        <div className="relative flex min-w-0 flex-1 flex-col bg-card px-4 pb-3 lg:rounded-[1.75rem] lg:px-10 lg:py-(--auth-panel-py)">
          {/* O card é `relative` pra páginas ancorarem elementos no canto (ex.: o
              link de voltar do esqueci a senha). */}
          <main className="flex flex-1 flex-col py-6">
            <div className="mx-auto w-full max-w-105 lg:my-auto">{children}</div>
          </main>
          <footer className="shrink-0 pt-2 text-center text-[13px] text-muted-foreground">
            {t('copyright')}{' '}
            <Link href="/termos" className={footerLinkClass}>
              {t('terms')}
            </Link>{' '}
            ·{' '}
            <Link href="/privacidade" className={footerLinkClass}>
              {t('privacy')}
            </Link>
          </footer>
        </div>
        <AuthShowcase />
      </div>
    </div>
  )
}
