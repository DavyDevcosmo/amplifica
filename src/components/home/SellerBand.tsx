import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FounderSeal } from '@/components/product/FounderSeal'
import { SELLER_RULES } from '@/components/seller/sellerEarnings'
import { getSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

const ctaBase =
  'inline-flex min-h-12 items-center rounded-[0.625rem] px-5.5 text-[0.9375rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-noite'

// Chamada do Programa Fundador (v4, versão "brilho"): painel noite centrado
// sobre o creme, com um brilho azul-gelo vazando pela direita e o título em
// degradê branco → névoa.
export async function SellerBand() {
  const t = await getTranslations('home.sellBand')
  const session = await getSession()
  // Quem já tem conta segue pro painel de vendedor; quem não tem, cria a conta.
  const startHref = session ? '/seller' : '/signup'

  return (
    <section aria-labelledby="vender-titulo" className="bg-background py-4 lg:py-16">
      <div className="mx-auto max-w-340 px-4 lg:px-8">
        <div className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-feature bg-noite px-5 py-16 text-center text-white lg:px-12 lg:py-30">
          <div
            aria-hidden
            className="absolute top-1/2 -right-40 -z-10 size-80 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(219_230_255/0.55)_0%,rgb(128_160_197/0.45)_30%,rgb(37_99_235/0.3)_55%,rgb(37_99_235/0)_85%)] opacity-80 blur-[48px] lg:-right-45 lg:size-155"
          />
          <div
            aria-hidden
            className="absolute -bottom-[55%] -left-[12%] -z-10 h-[110%] w-[70%] rounded-full bg-[radial-gradient(circle,rgb(43_74_111/0.9)_0%,rgb(43_74_111/0)_70%)] blur-[40px]"
          />

          <span className="inline-flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[0.625rem] bg-azul-bebe">
              <FounderSeal tone="bebe" className="size-6" />
            </span>
            <span className="text-[0.8125rem] leading-4 font-semibold tracking-[0.14em] text-nevoa uppercase">
              {t('badge')}
            </span>
          </span>

          <h2
            id="vender-titulo"
            className="max-w-[16ch] bg-linear-to-r from-white via-white via-55% to-nevoa bg-clip-text text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-transparent [font-stretch:100%] lg:text-[4.25rem]"
          >
            {t('title')}
          </h2>
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.625rem] text-nevoa">
            {t('text', { count: SELLER_RULES.founderFreeSales })}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href={startHref}
              className={cn(ctaBase, 'bg-white text-noite hover:bg-gelo')}
            >
              {t('start')}
            </Link>
            <Link
              href="/sell#como-funciona"
              className={cn(
                ctaBase,
                'border border-white/14 bg-white/8 text-white hover:bg-white/14',
              )}
            >
              {t('how')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
