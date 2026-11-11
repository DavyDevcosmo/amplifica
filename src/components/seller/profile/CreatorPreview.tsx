import { useLocale, useTranslations } from 'next-intl'
import { SOCIAL_NETWORKS } from '@/components/layout/SocialIcons'
import { FounderSeal } from '@/components/product/FounderSeal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export type CreatorSocials = {
  instagram: string
  youtube: string
  tiktok: string
  spotifyUrl: string
}

// Campo do perfil -> rede (o campo do Spotify se chama `spotifyUrl`).
const SOCIAL_FIELDS = [
  ['instagram', 'instagram'],
  ['youtube', 'youtube'],
  ['tiktok', 'tiktok'],
  ['spotifyUrl', 'spotify'],
] as const satisfies ReadonlyArray<
  readonly [keyof CreatorSocials, keyof typeof SOCIAL_NETWORKS]
>

// Bloco "Quem criou este pack" como o comprador vê na página do produto,
// montado com os valores que o vendedor está digitando (nada é salvo aqui).
export function CreatorPreview({
  name,
  bio,
  city,
  devices,
  socials,
  isFounder,
  imageUrl,
}: {
  name: string
  bio: string
  city: string
  devices: readonly string[]
  socials: CreatorSocials
  isFounder: boolean
  imageUrl: string | null
}) {
  const t = useTranslations('seller.profile.preview')
  const tShell = useTranslations('seller.shell')
  const locale = useLocale()

  const shownName = name.trim()
  const firstName = shownName.split(/\s+/)[0] || t('nameFallback')
  const deviceList = new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction',
  }).format(devices)
  const metaLine = [
    isFounder ? tShell('founder') : tShell('seller'),
    deviceList,
    city.trim(),
  ]
    .filter(Boolean)
    .join(' · ')
  const badges = SOCIAL_FIELDS.filter(([field]) => socials[field].trim() !== '')

  return (
    <section aria-label={t('label')} className="flex flex-col gap-2.5">
      <p className="type-eyebrow text-ardosia">{t('eyebrow')}</p>
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-3xl bg-marinho p-6 text-white md:p-10">
        <span className="relative flex-none" aria-hidden>
          <Avatar className="size-30 border-2 border-celeste after:hidden">
            {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
            <AvatarFallback className="bg-noite-3 text-3xl font-bold text-white">
              {getInitials(shownName) || '?'}
            </AvatarFallback>
          </Avatar>
          {isFounder ? (
            <FounderSeal className="absolute -right-1.5 -bottom-1 size-10" />
          ) : null}
        </span>

        <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-2.5">
          <p className="type-eyebrow text-celeste">{t('creator')}</p>
          <p className="font-display text-[clamp(1.375rem,2.2vw,1.875rem)] leading-[1.05] break-words">
            {shownName || t('namePlaceholder')}
          </p>
          <p className="text-[0.8125rem] leading-[1.125rem] font-semibold tracking-[0.12em] text-areia uppercase">
            {metaLine}
          </p>
          <p className="max-w-[62ch] text-[0.9375rem] leading-6 break-words whitespace-pre-line text-azul-bebe">
            {bio.trim() || t('bioPlaceholder')}
          </p>
          {badges.length > 0 ? (
            <div aria-hidden className="mt-1 flex gap-2">
              {badges.map(([field, network]) => {
                const { label, Icon } = SOCIAL_NETWORKS[network]
                return (
                  <span
                    key={field}
                    data-social={field}
                    title={label}
                    className="grid size-11 place-items-center rounded-full border-[1.5px] border-celeste"
                  >
                    <Icon className="size-4.5" />
                  </span>
                )
              })}
            </div>
          ) : null}
        </div>

        <span
          aria-hidden
          className="inline-flex min-h-12 flex-none items-center rounded-full bg-azul px-5.5 text-xs font-bold tracking-[0.12em] uppercase"
        >
          {t('otherProducts', { name: firstName })}
        </span>
      </div>
      <p className="text-[0.8125rem] leading-[1.1875rem] text-ardosia">{t('note')}</p>
    </section>
  )
}
