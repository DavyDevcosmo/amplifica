import { ArrowRightIcon, CheckIcon, PlayIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { BuyPanel } from '@/components/product/BuyPanel'
import { FounderSeal } from '@/components/product/FounderSeal'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductReviews } from '@/components/product/ProductReviews'
import { SellerSpotlight } from '@/components/product/SellerSpotlight'
// Dados de exemplo até existir server/queries/productQueries.ts.
import {
  discountPercent,
  getRelatedProducts,
  getSampleProduct,
  SAMPLE_PRODUCTS,
} from '@/components/product/sampleProducts'
import { SELLER_RULES } from '@/components/seller/sellerEarnings'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import productCover from '../../../../../../public/images/product-cover.webp'

export function generateStaticParams() {
  return SAMPLE_PRODUCTS.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = getSampleProduct(slug)
  if (!product) return {}
  const t = await getTranslations('meta')
  return {
    title: t('product', { title: product.title }),
    description: product.description,
  }
}

const wrap = 'mx-auto max-w-340 px-4 lg:px-8'
const h2Class = 'font-display text-[1.75rem] leading-[1.05] lg:text-4xl'

// Página do produto (v4): topo e "Sobre o pack" numa faixa noite contínua,
// com o painel de compra branco; avaliações e relacionados no creme; o
// vendedor no marinho.
export default async function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params
  const product = getSampleProduct(slug)
  if (!product) notFound()

  const t = await getTranslations('product')
  const tCard = await getTranslations('productCard')
  const locale = await getLocale()
  const discount = discountPercent(product)
  const related = getRelatedProducts(product)
  const free = product.priceCents === 0
  const kind = tCard(`kind.${product.kind}`)

  const perks = [
    t('buy.instant'),
    t('buy.refund', { days: SELLER_RULES.refundWindowDays }),
    t('buy.specsInfo'),
  ]
  const specs = [
    { key: 'device', value: product.specs.device },
    { key: 'firmware', value: product.specs.firmware ?? t('specs.bySeller') },
    { key: 'files', value: product.specs.files },
    { key: 'format', value: product.specs.format },
  ].filter((spec): spec is { key: string; value: string } => Boolean(spec.value))

  return (
    <div className="pb-20 lg:pb-0">
      <section
        aria-labelledby="produto-titulo"
        className="bg-noite bg-[radial-gradient(55%_60%_at_20%_40%,rgb(37_99_235/0.3)_0%,rgb(37_99_235/0)_70%)] text-white"
      >
        <div className={cn(wrap, 'flex flex-col gap-7 pt-6 pb-12 lg:pt-8 lg:pb-16')}>
          <nav aria-label={t('breadcrumb')}>
            <ol className="flex flex-wrap items-center gap-2 text-xs leading-4 font-semibold tracking-[0.16em] text-celeste uppercase">
              <li>
                <Link href="/#catalogo" className="rounded-sm hover:text-white">
                  {t('presets')}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/#pedaleiras" className="rounded-sm hover:text-white">
                  {product.brand}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-white">
                {product.title}
              </li>
            </ol>
          </nav>

          <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr] lg:gap-12">
            <div className="relative aspect-16/10 overflow-hidden rounded-feature border border-celeste/25 bg-noite-3">
              <Image
                src={productCover}
                alt={t('coverAlt', { title: product.title })}
                fill
                priority
                sizes="(min-width: 1024px) 760px, 100vw"
                className="object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1.5 text-[0.8125rem] leading-4 font-bold text-preto">
                  -{discount}%
                </span>
              )}
            </div>

            <aside
              aria-label={t('buy.label')}
              className="flex flex-col gap-5 rounded-feature bg-white p-6 text-preto lg:p-8"
            >
              <div className="flex flex-col gap-2.5">
                <p className="type-eyebrow text-tinta">
                  {product.device} · {kind}
                </p>
                <h1
                  id="produto-titulo"
                  className="font-display text-[1.8125rem] leading-[1.05] lg:text-4xl"
                >
                  {product.title}
                </h1>
                <p className="text-base leading-[1.5625rem] text-tinta">
                  {product.description}
                </p>
                <a
                  href="#vendedor"
                  className="inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-sm text-marinho outline-none focus-visible:ring-2 focus-visible:ring-azul"
                >
                  <span>
                    {t('buy.byPrefix')}{' '}
                    <span className="underline underline-offset-3">
                      {product.seller.name}
                    </span>
                  </span>
                  {product.founder && (
                    <FounderSeal label={tCard('founder')} className="size-5" />
                  )}
                </a>
              </div>

              <BuyPanel
                slug={product.slug}
                priceCents={product.priceCents}
                compareAtCents={product.compareAtCents}
                discount={discount}
              />

              <ul className="flex flex-col gap-2.5 text-sm leading-5">
                {perks.map((perk) => (
                  <li key={perk} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="grid size-5.5 shrink-0 place-items-center rounded-full bg-azul/12 text-azul"
                    >
                      <CheckIcon className="size-3" strokeWidth={2.8} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="sobre-titulo"
        className="bg-noite bg-[radial-gradient(55%_70%_at_80%_65%,rgb(37_99_235/0.3)_0%,rgb(37_99_235/0)_70%)] pt-6 pb-18 text-white lg:pt-12 lg:pb-28"
      >
        <div
          className={cn(
            wrap,
            'grid items-start gap-x-16 gap-y-10 lg:grid-cols-[7fr_5fr]',
          )}
        >
          <div className="flex flex-col gap-5">
            <p className="type-eyebrow text-celeste">{t('about.eyebrow')}</p>
            <h2 id="sobre-titulo" className={h2Class}>
              {t('about.title')}
            </h2>
            {product.about.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="max-w-[64ch] text-base leading-[1.6875rem] text-nevoa"
              >
                {paragraph}
              </p>
            ))}
            {product.includes.length > 0 && (
              <>
                <h3 className="mt-3 type-eyebrow [font-stretch:100%]">
                  {t('about.includes')}
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {product.includes.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-cover border border-celeste/18 bg-noite-3 p-4 text-[0.9375rem] leading-[1.375rem]"
                    >
                      <span
                        aria-hidden
                        className="grid size-5.5 shrink-0 place-items-center rounded-full bg-azul"
                      >
                        <CheckIcon className="size-3" strokeWidth={2.8} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <dl
              aria-label={t('specs.label')}
              className="flex flex-col rounded-card border border-celeste/25 bg-noite-2 px-6 py-3"
            >
              {specs.map((spec) => (
                <div
                  key={spec.key}
                  className="flex justify-between gap-4 border-b border-celeste/18 py-3 text-sm leading-5 last:border-b-0"
                >
                  <dt className="font-semibold tracking-[0.12em] text-celeste uppercase">
                    {t(`specs.${spec.key}`)}
                  </dt>
                  <dd className="text-right font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>

            {product.video && (
              // Placeholder: o vídeo do YouTube entra quando o produto tiver o
              // link cadastrado (embed leve, carrega no clique).
              <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-card border border-celeste/25 bg-noite-3">
                <span className="absolute top-4 left-5 text-[0.8125rem] leading-4 tracking-[0.08em] text-celeste">
                  {t('video.placeholder')}
                </span>
                <span
                  aria-hidden
                  className="grid size-18 place-items-center rounded-full bg-azul"
                >
                  <PlayIcon className="size-6.5 fill-current" />
                </span>
                <span className="sr-only">
                  {t('video.play', { title: product.video.title })}
                </span>
                <span className="absolute bottom-4 left-5 text-[0.8125rem] leading-4 font-semibold tracking-[0.08em] uppercase">
                  {t('video.source', { duration: product.video.duration })}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <ProductReviews rating={product.rating} reviews={product.reviews} />

      <SellerSpotlight seller={product.seller} founder={Boolean(product.founder)} />

      <section aria-labelledby="relacionados-titulo" className="bg-background">
        <div className={cn(wrap, 'flex flex-col gap-8 py-18 lg:py-28')}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="type-eyebrow text-azul dark:text-azul-claro">
                {t('related.eyebrow', { brand: product.brand })}
              </p>
              <h2 id="relacionados-titulo" className={h2Class}>
                {t('related.title')}
              </h2>
            </div>
            <Link
              href="/#catalogo"
              className="inline-flex min-h-11 items-center gap-2 rounded-full type-label text-azul outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-azul-claro"
            >
              {t('related.seeAll')}
              <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Barra de compra fixa no mobile (o painel de compra some da tela ao rolar). */}
      <div className="fixed inset-x-0 bottom-0 z-15 flex items-center justify-between gap-3 border-t border-celeste/20 bg-noite px-4 py-3 text-white lg:hidden">
        <div className="flex flex-col">
          {discount > 0 && product.compareAtCents && (
            <s className="text-xs leading-4 text-celeste">
              {formatCurrency(product.compareAtCents, { locale })}
            </s>
          )}
          <span className="font-display text-lg leading-none">
            {free ? tCard('free') : formatCurrency(product.priceCents, { locale })}
          </span>
        </div>
        <Link
          href={`/checkout?produto=${product.slug}`}
          className={cn(buttonVariants({ size: 'pill' }), 'h-12 px-6')}
        >
          {free ? tCard('download') : tCard('buy')}
        </Link>
      </div>
    </div>
  )
}
