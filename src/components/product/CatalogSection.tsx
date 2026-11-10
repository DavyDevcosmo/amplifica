'use client'

import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductCardData } from '@/components/product/sampleProducts'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Vitrine da home: chips de pedaleira filtram a grade na hora (estado local;
// o catálogo completo em /products vai usar searchParams).
export function CatalogSection({
  products,
  brands,
}: {
  products: ProductCardData[]
  brands: readonly string[]
}) {
  const t = useTranslations('home.catalog')
  const [brand, setBrand] = useState('')

  const visible = brand
    ? products.filter((product) => product.brand === brand)
    : products
  const chips = ['', ...brands]

  return (
    <section
      id="catalogo"
      aria-labelledby="catalogo-titulo"
      className="scroll-mt-24 bg-background pt-12 pb-16 lg:pt-20 lg:pb-26"
    >
      <div className="mx-auto flex max-w-340 flex-col gap-7 px-4 lg:px-8">
        {/* fieldset + legend: a pergunta da eyebrow é o nome do grupo de chips. */}
        <fieldset
          id="pedaleiras"
          className="flex min-w-0 scroll-mt-28 flex-col gap-3.5"
        >
          <legend className="mb-3.5 type-eyebrow text-azul dark:text-azul-claro">
            {t('eyebrow')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const selected = chip === brand
              return (
                <button
                  key={chip || 'all'}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setBrand(chip)}
                  className={cn(
                    'min-h-11 rounded-full border px-4.5 text-xs leading-4 font-semibold tracking-[0.1em] uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-foreground',
                  )}
                >
                  {chip || t('all')}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2
              id="catalogo-titulo"
              className="font-display text-[1.75rem] leading-[1.1] lg:text-[2.75rem]"
            >
              {brand ? t('titleFor', { brand }) : t('title')}
            </h2>
            <p className="text-[0.9375rem] leading-[1.375rem] text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          {/* O catálogo completo (/products) ainda não existe: por ora, a grade
              da home é a lista inteira. */}
          <Link
            href="/#catalogo"
            className="group/all inline-flex items-center gap-2.5 rounded-full type-label text-azul outline-none dark:text-azul-claro focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('seeAll')}
            <span
              aria-hidden
              className="grid size-11 place-items-center rounded-full border border-current group-hover/all:bg-azul group-hover/all:text-white"
            >
              <ArrowRightIcon className="size-4" />
            </span>
          </Link>
        </div>

        {visible.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-card border border-ardosia/25 bg-card px-6 py-12 text-center">
            <p className="font-display text-xl leading-tight font-medium">
              {t('emptyTitle', { brand })}
            </p>
            <p className="max-w-[44ch] text-[0.9375rem] leading-[1.375rem] text-muted-foreground">
              {t('emptyText')}
            </p>
            <button
              type="button"
              onClick={() => setBrand('')}
              className={buttonVariants({ size: 'pill' })}
            >
              {t('emptyAction')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
