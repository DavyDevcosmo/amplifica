import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  InstagramIcon,
  SpotifyIcon,
  TiktokIcon,
  YoutubeIcon,
} from '@/components/layout/SocialIcons'
import { FounderSeal } from '@/components/product/FounderSeal'
import type { ProductSeller } from '@/components/product/sampleProducts'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NETWORKS = {
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  youtube: { label: 'YouTube', Icon: YoutubeIcon },
  tiktok: { label: 'TikTok', Icon: TiktokIcon },
  spotify: { label: 'Spotify', Icon: SpotifyIcon },
} as const

// Faixa marinho "Quem criou este pack": foto (com o selo, se for fundador),
// nome, bio, redes e link pra loja.
export async function SellerSpotlight({
  seller,
  founder,
}: {
  seller: ProductSeller
  founder: boolean
}) {
  const t = await getTranslations('product.seller')
  const tCard = await getTranslations('productCard')

  return (
    <div className="bg-marinho py-18 text-white lg:py-28">
      <section
        id="vendedor"
        aria-labelledby="vendedor-titulo"
        className="mx-auto grid max-w-340 items-center gap-x-10 gap-y-6 px-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8"
      >
        {/* Placeholder até o perfil de vendedor ter foto. */}
        <div className="relative grid size-24 place-items-center rounded-full border-2 border-celeste bg-noite-3 text-xs tracking-[0.08em] text-celeste lg:size-35">
          <span aria-hidden>{t('photo')}</span>
          {founder && (
            <FounderSeal
              label={tCard('founder')}
              className="absolute -right-1.5 -bottom-1 size-9 lg:size-11"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="type-eyebrow text-celeste">{t('eyebrow')}</p>
          <h2
            id="vendedor-titulo"
            className="font-display text-[1.375rem] leading-none lg:text-[1.8125rem]"
          >
            {seller.name}
          </h2>
          <p className="text-[0.8125rem] leading-[1.125rem] font-semibold tracking-[0.12em] text-areia uppercase">
            {t('meta', {
              year: seller.since,
              count: seller.packCount,
              devices: seller.devices,
            })}
          </p>
          <p className="max-w-[62ch] text-base leading-[1.625rem] text-gelo">
            {seller.bio}
          </p>
          {seller.social.length > 0 && (
            <ul
              aria-label={t('social', { name: seller.name })}
              className="mt-1 flex flex-wrap gap-2"
            >
              {seller.social.map(({ network, href }) => {
                const { label, Icon } = NETWORKS[network]
                return (
                  <li key={network}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-11 place-items-center rounded-full border-[1.5px] border-celeste outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-marinho"
                    >
                      <Icon className="size-4.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <Link
          href={`/stores/${seller.slug}`}
          className={cn(
            buttonVariants({ size: 'pill' }),
            'h-12 justify-self-start px-6 text-[0.8125rem] lg:justify-self-end',
          )}
        >
          {t('seeAll', { count: seller.packCount })}
          <ArrowRightIcon aria-hidden className="size-4" />
        </Link>
      </section>
    </div>
  )
}
