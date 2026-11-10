import {
  ArrowRightIcon,
  CalendarOffIcon,
  CheckIcon,
  DownloadIcon,
  LayoutGridIcon,
  PlayIcon,
  StoreIcon,
  TagIcon,
  TrendingUpIcon,
  UploadIcon,
  UserRoundIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { FounderSeal } from '@/components/product/FounderSeal'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductCardData } from '@/components/product/sampleProducts'
import { SELLER_RULES } from '@/components/seller/sellerEarnings'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import sellHero from '../../../public/images/sell-hero.webp'

// Seções da landing /sell (v4). O ritmo alterna faixas escuras fixas (noite,
// marinho, azul) com faixas claras por token (branco/creme, que no tema
// escuro viram marinho/preto).

const wrap = 'mx-auto max-w-340 px-4 lg:px-8'
const section = 'py-18 lg:py-28'
const h2Class = 'font-display text-[1.75rem] leading-[1.05] lg:text-[2.5rem]'
// Rótulo azul sobre faixa clara; azul-claro no tema escuro pra passar AA.
const lightEyebrow = 'text-azul dark:text-azul-claro'

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('type-eyebrow', className)}>{children}</p>
}

const primaryCta = cn(
  buttonVariants({ size: 'pill-lg' }),
  'whitespace-normal text-center',
)

export async function SellHero({ ctaHref }: { ctaHref: string }) {
  const t = await getTranslations('sell.hero')

  return (
    <section
      aria-labelledby="vender-hero"
      className="relative flex min-h-170 items-end overflow-hidden bg-noite text-white lg:min-h-190 lg:items-center"
    >
      <Image
        src={sellHero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[78%_30%] lg:object-right"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(40%_60%_at_20%_60%,rgb(37_99_235/0.35)_0%,rgb(37_99_235/0)_70%),linear-gradient(to_top,rgb(10_22_38/0.96)_0%,rgb(10_22_38/0.85)_45%,rgb(10_22_38/0.15)_100%)] lg:bg-[radial-gradient(40%_60%_at_20%_60%,rgb(37_99_235/0.35)_0%,rgb(37_99_235/0)_70%),linear-gradient(to_right,rgb(10_22_38/0.96)_0%,rgb(10_22_38/0.85)_42%,rgb(10_22_38/0.1)_75%)]"
      />
      <div className={cn(wrap, 'relative w-full pt-55 pb-8 lg:py-24')}>
        <div className="flex max-w-170 flex-col items-start gap-6">
          <Eyebrow className="text-celeste">{t('eyebrow')}</Eyebrow>
          <h1
            id="vender-hero"
            className="font-display text-4xl leading-[1.03] lg:text-6xl"
          >
            {t('title')} <span className="text-azul-claro">{t('titleAccent')}</span>
          </h1>
          <p className="max-w-[46ch] text-[1.0625rem] leading-normal text-nevoa lg:text-[1.1875rem]">
            {t('lead')}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
            <Link href={ctaHref} className={primaryCta}>
              {t('cta')}
              <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
            <Link
              href="#simulador"
              className={cn(
                buttonVariants({ variant: 'outline-strong', size: 'pill-lg' }),
                'border border-celeste/50 text-white hover:bg-celeste/12',
              )}
            >
              {t('simulate')}
            </Link>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-nevoa">
            <CheckIcon
              aria-hidden
              className="size-4 text-azul-claro"
              strokeWidth={2.2}
            />
            {t('free')}
          </span>
        </div>
      </div>
    </section>
  )
}

export async function SellIdentity() {
  const t = await getTranslations('sell.identity')

  return (
    <section aria-labelledby="vender-som" className={cn(section, 'bg-card')}>
      <div className={cn(wrap, 'grid items-center gap-x-16 gap-y-10 lg:grid-cols-2')}>
        {/* Placeholder até a foto definitiva. */}
        <div className="grid aspect-5/4 place-items-center rounded-feature border border-dashed border-border bg-background p-6 text-center text-[0.8125rem] tracking-[0.08em] text-muted-foreground">
          {t('photo')}
        </div>
        <div className="flex flex-col gap-5">
          <Eyebrow className={lightEyebrow}>{t('eyebrow')}</Eyebrow>
          <h2 id="vender-som" className={h2Class}>
            {t('title')}
          </h2>
          <p className="max-w-[48ch] text-[1.0625rem] leading-[1.55] text-muted-foreground lg:text-lg">
            {t('text')}
          </p>
        </div>
      </div>
    </section>
  )
}

export async function SellSteps() {
  const t = await getTranslations('sell.steps')
  const steps = [
    { key: 'account', Icon: UserRoundIcon },
    { key: 'publish', Icon: UploadIcon },
    { key: 'sell', Icon: TrendingUpIcon },
  ] as const

  return (
    <section
      id="como-funciona"
      aria-labelledby="vender-passos"
      className={cn(section, 'scroll-mt-24 bg-background')}
    >
      <div className={cn(wrap, 'flex flex-col gap-12')}>
        <div className="flex flex-col gap-3">
          <Eyebrow className={lightEyebrow}>{t('eyebrow')}</Eyebrow>
          <h2 id="vender-passos" className={h2Class}>
            {t('title')}
          </h2>
        </div>
        <ol className="grid gap-5 lg:grid-cols-3">
          {steps.map(({ key, Icon }, index) => (
            <li key={key} className="flex flex-col gap-4 rounded-card bg-card p-8">
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-full bg-azul font-display text-xl text-white">
                  {index + 1}
                </span>
                <Icon aria-hidden className="size-7 text-ardosia" strokeWidth={1.6} />
              </div>
              <h3 className="font-display text-xl leading-[1.3]">{t(`${key}Title`)}</h3>
              <p className="text-[0.9375rem] leading-[1.4375rem] text-muted-foreground">
                {t(`${key}Text`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export async function SellWhy() {
  const t = await getTranslations('sell.why')
  const tPreview = await getTranslations('sell.publishPreview')
  const benefits = [
    { key: 'store', Icon: StoreIcon },
    { key: 'showcase', Icon: LayoutGridIcon },
    { key: 'price', Icon: TagIcon },
    { key: 'delivery', Icon: DownloadIcon },
    { key: 'noFee', Icon: CalendarOffIcon },
  ] as const
  const fields = [
    { key: 'name', placeholder: tPreview('namePlaceholder') },
    { key: 'device', placeholder: tPreview('devicePlaceholder') },
    { key: 'price', placeholder: tPreview('pricePlaceholder') },
  ] as const

  return (
    <section
      aria-labelledby="vender-porque"
      className={cn(section, 'bg-marinho text-white')}
    >
      <div className={cn(wrap, 'grid items-center gap-x-16 gap-y-10 lg:grid-cols-2')}>
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <Eyebrow className="text-celeste">{t('eyebrow')}</Eyebrow>
            <h2 id="vender-porque" className={h2Class}>
              {t('title')}
            </h2>
          </div>
          <ul className="flex flex-col">
            {benefits.map(({ key, Icon }) => (
              <li
                key={key}
                className="flex items-start gap-4 border-t border-celeste/25 py-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-azul/22 text-azul-claro">
                  <Icon aria-hidden className="size-5" strokeWidth={1.8} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-base leading-[1.375rem]">
                    {t(`${key}Title`)}
                  </strong>
                  <span className="text-[0.9375rem] leading-[1.375rem] text-nevoa">
                    {t(`${key}Text`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prévia ilustrativa da tela de publicar: não é um formulário. */}
        <div
          role="img"
          aria-label={tPreview('label')}
          className="flex flex-col gap-4 rounded-feature bg-white p-7 text-preto"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[1.0625rem]">{tPreview('title')}</span>
            <span className="rounded-full bg-creme px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.12em] text-ardosia uppercase">
              {tPreview('draft')}
            </span>
          </div>
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-bold tracking-[0.12em] text-ardosia uppercase">
                {tPreview(field.key)}
              </span>
              <span className="flex min-h-11 items-center rounded-tile border-[1.5px] border-ardosia/30 px-3.5 text-[0.9375rem] text-ardosia">
                {field.placeholder}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <span className="flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-cover border-[1.5px] border-dashed border-azul/50 bg-azul/5 text-[0.8125rem] text-azul-forte">
              <UploadIcon aria-hidden className="size-5" strokeWidth={1.8} />
              {tPreview('files')}
            </span>
            <span className="flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-cover border-[1.5px] border-dashed border-azul/50 bg-azul/5 text-[0.8125rem] text-azul-forte">
              <PlayIcon aria-hidden className="size-5 fill-current" />
              {tPreview('audio')}
            </span>
          </div>
          <span className={cn(buttonVariants({ size: 'pill-lg' }), 'h-12 w-full')}>
            {tPreview('publish')}
          </span>
        </div>
      </div>
    </section>
  )
}

export async function SellFounder({
  ctaHref,
  card,
}: {
  ctaHref: string
  card: ProductCardData
}) {
  const t = await getTranslations('sell.founder')
  const perks = [
    t('badge'),
    t('highlight'),
    t('commission', {
      count: SELLER_RULES.founderFreeSales,
      days: SELLER_RULES.founderWindowDays,
    }),
  ]

  return (
    <section
      id="fundador"
      aria-labelledby="vender-fundador"
      className={cn(
        section,
        'bg-noite bg-[radial-gradient(45%_70%_at_80%_50%,rgb(37_99_235/0.3)_0%,rgb(37_99_235/0)_70%)] text-white',
      )}
    >
      <div
        className={cn(
          wrap,
          'grid items-center gap-x-14 gap-y-10 lg:grid-cols-[6fr_5fr]',
        )}
      >
        <div className="flex flex-col items-start gap-5">
          <span className="flex items-center gap-3.5">
            <FounderSeal className="size-14" />
            <Eyebrow className="text-areia">{t('eyebrow')}</Eyebrow>
          </span>
          <h2 id="vender-fundador" className={h2Class}>
            {t('title')}
          </h2>
          <p className="max-w-[48ch] text-[1.0625rem] leading-[1.625rem] text-nevoa">
            {t('text')}
          </p>
          <ul className="flex flex-col gap-3 text-base leading-[1.375rem]">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-azul">
                  <CheckIcon aria-hidden className="size-3.5" strokeWidth={2.6} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <p className="text-[0.8125rem] leading-[1.125rem] text-celeste">
            {t('note')}
          </p>
          <Link href={ctaHref} className={primaryCta}>
            {t('cta')}
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-75">
            <ProductCard product={card} />
          </div>
        </div>
      </div>
    </section>
  )
}

export async function SellClosing({ ctaHref }: { ctaHref: string }) {
  const t = await getTranslations('sell.cta')

  return (
    <section aria-labelledby="vender-fim" className="bg-azul py-24 text-white">
      <div className={cn(wrap, 'flex flex-col items-center gap-5 text-center')}>
        <h2
          id="vender-fim"
          className="max-w-[16ch] font-display text-[1.9375rem] leading-[1.04] lg:text-[3.25rem]"
        >
          {t('title')}
        </h2>
        <p className="max-w-[46ch] text-[1.0625rem] leading-[1.625rem] text-gelo">
          {t('text')}
        </p>
        <Link
          href={ctaHref}
          className={cn(
            buttonVariants({ variant: 'inverse', size: 'pill-lg' }),
            'px-8 text-azul-forte hover:bg-gelo',
          )}
        >
          {t('button')}
        </Link>
      </div>
    </section>
  )
}
