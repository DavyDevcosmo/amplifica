'use client'

import { CheckIcon } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'

// Preço e ações de compra, dentro do painel branco da página de produto (as
// cores são fixas: o painel é branco nos dois temas). O carrinho ainda não
// existe: "Adicionar ao carrinho" só alterna o estado visual (aria-pressed)
// até `useCart` e `cartActions` existirem. "Comprar agora" já aponta pro
// checkout (protegido pelo proxy; a página ainda não existe).
export function BuyPanel({
  slug,
  priceCents,
  compareAtCents,
  discount,
}: {
  slug: string
  priceCents: number
  compareAtCents?: number
  discount: number
}) {
  const t = useTranslations('product')
  const tCard = useTranslations('productCard')
  const locale = useLocale()
  const [inCart, setInCart] = useState(false)
  const free = priceCents === 0

  return (
    <div className="flex flex-col gap-3.5 border-t border-ardosia/20 pt-5">
      <div className="flex flex-col gap-1">
        {discount > 0 && compareAtCents && (
          <div className="flex items-center gap-2.5">
            <s className="text-[0.9375rem] leading-5 text-ardosia">
              {formatCurrency(compareAtCents, { locale })}
            </s>
            <span className="rounded-full bg-azul/12 px-2.5 py-0.5 text-xs leading-[1.125rem] font-bold text-azul-forte">
              <span className="sr-only">{t('discount', { percent: discount })}</span>
              <span aria-hidden>-{discount}%</span>
            </span>
          </div>
        )}
        <span className="font-display text-[2.375rem] leading-none tabular-nums">
          {free ? tCard('free') : formatCurrency(priceCents, { locale })}
        </span>
        {!free && (
          <span className="text-[0.8125rem] leading-[1.125rem] text-ardosia">
            {t('buy.payment')}
          </span>
        )}
      </div>

      <Link
        href={`/checkout?produto=${slug}`}
        className={cn(
          buttonVariants({ size: 'pill-lg' }),
          'w-full text-sm tracking-[0.14em]',
        )}
      >
        {free ? t('buy.downloadFree') : t('buy.buyNow')}
      </Link>
      {!free && (
        <button
          type="button"
          aria-pressed={inCart}
          onClick={() => setInCart((value) => !value)}
          className={cn(
            buttonVariants({ variant: 'outline-strong', size: 'pill-lg' }),
            'h-13 w-full border-marinho/35 text-marinho hover:bg-marinho/5',
          )}
        >
          {inCart && <CheckIcon aria-hidden className="size-4" strokeWidth={2.2} />}
          {t(inCart ? 'buy.inCart' : 'buy.addToCart')}
        </button>
      )}
    </div>
  )
}
