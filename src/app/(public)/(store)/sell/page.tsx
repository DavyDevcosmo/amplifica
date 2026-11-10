import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ProductCardData } from '@/components/product/sampleProducts'
import { EarningsSimulator } from '@/components/seller/EarningsSimulator'
import { SellFaq } from '@/components/seller/SellFaq'
import {
  SellClosing,
  SellFounder,
  SellHero,
  SellIdentity,
  SellSteps,
  SellWhy,
} from '@/components/seller/SellLanding'
import { getSession } from '@/lib/auth'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return { title: t('sell') }
}

const eyebrowClass = 'type-eyebrow text-azul dark:text-azul-claro'
const h2Class = 'font-display text-[1.75rem] leading-[1.05] lg:text-[2.5rem]'

export default async function SellPage() {
  const session = await getSession()
  const t = await getTranslations('sell')
  // Quem já tem conta segue pro painel de vendedor (onboarding ainda não
  // existe); quem não tem, cria a conta primeiro.
  const ctaHref = session ? '/seller' : '/signup'

  // Card de exemplo do Programa Fundador: mostra como o produto aparece na loja.
  const exampleCard: ProductCardData = {
    slug: 'plexi-68-helix',
    device: 'LINE 6 HELIX',
    brand: 'LINE 6',
    kind: 'PRESET',
    title: t('founder.cardTitle'),
    description: t('founder.cardText'),
    priceCents: 4900,
    founder: true,
  }

  return (
    <>
      <SellHero ctaHref={ctaHref} />
      <SellIdentity />
      <SellSteps />
      <SellWhy />
      <SellFounder ctaHref={ctaHref} card={exampleCard} />

      <section
        id="simulador"
        aria-labelledby="vender-simulador"
        className="scroll-mt-24 bg-card py-18 lg:py-28"
      >
        <div className="mx-auto flex max-w-340 flex-col gap-8 px-4 lg:px-8">
          <div className="flex flex-col gap-3">
            <p className={eyebrowClass}>{t('simulator.eyebrow')}</p>
            <h2 id="vender-simulador" className={h2Class}>
              {t('simulator.title')}
            </h2>
            <p className="max-w-[60ch] text-[1.0625rem] leading-[1.625rem] text-muted-foreground">
              {t('simulator.text')}
            </p>
          </div>
          <EarningsSimulator />
        </div>
      </section>

      <section aria-labelledby="vender-faq" className="bg-background py-18 lg:py-28">
        <div className="mx-auto grid max-w-340 items-start gap-x-16 gap-y-8 px-4 lg:grid-cols-[4fr_6fr] lg:px-8">
          <div className="flex flex-col gap-3 lg:sticky lg:top-30">
            <p className={eyebrowClass}>{t('faq.eyebrow')}</p>
            <h2 id="vender-faq" className={h2Class}>
              {t('faq.title')}
            </h2>
          </div>
          <SellFaq />
        </div>
      </section>

      <SellClosing ctaHref={ctaHref} />
    </>
  )
}
