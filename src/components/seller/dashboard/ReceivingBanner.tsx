import { LandmarkIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// Faixa noite com brilho azul: lembra de conectar o recebimento. Publicar não
// pede dado bancário; vender pede.
export function ReceivingBanner() {
  const t = useTranslations('seller.dashboard.banner')

  return (
    <section
      aria-labelledby="receiving-banner-title"
      className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-card bg-noite bg-[radial-gradient(60%_120%_at_100%_50%,rgb(37_99_235/0.35)_0%,transparent_70%)] px-6 py-6 text-white sm:px-7"
    >
      <div className="flex max-w-160 items-start gap-4">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-tile bg-azul/25 text-azul-claro"
        >
          <LandmarkIcon className="size-5.5" strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-1">
          <h2
            id="receiving-banner-title"
            className="font-sans text-[1.0625rem] leading-6 font-bold normal-case [font-stretch:100%]"
          >
            {t('title')}
          </h2>
          <p className="text-sm leading-[1.3125rem] text-nevoa">{t('body')}</p>
        </div>
      </div>
      <Link
        href="/seller/payouts"
        className="type-label inline-flex min-h-11 items-center rounded-full bg-white px-5 text-noite outline-none hover:bg-creme focus-visible:ring-2 focus-visible:ring-azul-claro"
      >
        {t('cta')}
      </Link>
    </section>
  )
}
