'use client'

import { ArrowRightIcon, PauseIcon, PlayIcon } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { FounderSeal } from '@/components/product/FounderSeal'
import {
  discountPercent,
  type ProductCardData,
} from '@/components/product/sampleProducts'
import { cn, formatCurrency } from '@/lib/utils'

// Card de preset do Marinho: capa com prévia de áudio, pedaleira, título,
// descrição curta e preço. A prévia ainda é só estado visual — não há arquivo
// de áudio até o upload de produto existir; o botão já tem o rótulo e o
// aria-pressed que o player real vai usar.
export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData
  className?: string
}) {
  const t = useTranslations('productCard')
  const locale = useLocale()
  const [playing, setPlaying] = useState(false)

  const free = product.priceCents === 0
  const off = discountPercent(product)
  const href = `/products/${product.slug}`

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-card border border-ardosia/25 bg-white text-preto',
        className,
      )}
    >
      <div className="relative mx-2 mt-2 aspect-16/10 shrink-0 rounded-cover bg-linear-135 from-ardosia to-celeste">
        {off > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-[0.6875rem] leading-4 font-bold tracking-[0.04em] text-preto">
            -{off}%
          </span>
        )}
        {product.founder && (
          <FounderSeal
            label={t('founder')}
            className="absolute -top-2.5 -right-2 size-12"
          />
        )}
        <button
          type="button"
          aria-pressed={playing}
          aria-label={t(playing ? 'pauseLabel' : 'listenLabel', {
            title: product.title,
          })}
          onClick={() => setPlaying((value) => !value)}
          className="absolute right-2.5 bottom-2.5 inline-flex min-h-10 items-center gap-2 rounded-full bg-white py-0 pr-4 pl-1.5 text-[0.6875rem] font-bold tracking-[0.12em] text-preto uppercase outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-azul"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-full bg-azul text-white"
          >
            {playing ? (
              <PauseIcon className="size-3 fill-current" />
            ) : (
              <PlayIcon className="size-3 fill-current" />
            )}
          </span>
          {t(playing ? 'pause' : 'listen')}
        </button>
        {playing && (
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.75 bg-white/35">
            <div className="h-full w-[38%] bg-white" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4.5 pt-4 pb-4.5">
        <p className="text-[0.6875rem] leading-4 font-semibold tracking-[0.16em] text-ardosia uppercase">
          {product.device} · {t(`kind.${product.kind}`)}
        </p>
        <h3 className="font-display text-[1.0625rem] leading-[1.375rem] font-semibold">
          <Link
            href={href}
            className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.title}
          </Link>
        </h3>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-ardosia">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2.5 pt-2">
          <div className="flex min-w-0 flex-col">
            {off > 0 && product.compareAtCents && (
              <s className="text-xs leading-4 text-ardosia">
                {formatCurrency(product.compareAtCents, { locale })}
              </s>
            )}
            <span className="font-display text-[1.1875rem] leading-6 whitespace-nowrap tabular-nums">
              {free ? t('free') : formatCurrency(product.priceCents, { locale })}
            </span>
          </div>
          <Link
            href={href}
            aria-label={t(free ? 'downloadLabel' : 'buyLabel', {
              title: product.title,
            })}
            className="group/buy inline-flex shrink-0 items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="inline-flex min-h-10 items-center rounded-full bg-azul px-4 text-[0.6875rem] leading-4 font-bold tracking-[0.12em] text-white uppercase group-hover/buy:bg-azul-forte">
              {t(free ? 'download' : 'buy')}
            </span>
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-full bg-azul text-white group-hover/buy:bg-azul-forte"
            >
              <ArrowRightIcon className="size-4" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  )
}
