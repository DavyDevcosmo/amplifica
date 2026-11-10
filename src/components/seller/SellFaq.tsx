'use client'

import { useTranslations } from 'next-intl'
import { COMMISSION_PERCENT, SELLER_RULES } from '@/components/seller/sellerEarnings'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// Ordem das perguntas; os textos ficam em sell.faq.<chave>Q / <chave>A.
const QUESTIONS = [
  'what',
  'site',
  'cost',
  'price',
  'payout',
  'delivery',
  'followers',
  'own',
  'kinds',
] as const

export function SellFaq() {
  const t = useTranslations('sell.faq')
  const values = { percent: COMMISSION_PERCENT, days: SELLER_RULES.payoutHoldDays }

  return (
    <Accordion defaultValue={['what']} className="border-y border-border">
      {QUESTIONS.map((key, index) => (
        <AccordionItem
          key={key}
          value={key}
          className="border-border not-last:border-b"
        >
          <AccordionTrigger className="min-h-16 items-center gap-4 rounded-none py-4 text-[1.0625rem] leading-6 font-semibold hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-foreground">
            <span className="w-10 shrink-0 font-display text-base text-azul dark:text-azul-claro">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex-1">{t(`${key}Q`)}</span>
          </AccordionTrigger>
          <AccordionContent className="pr-10 pb-5 pl-12 text-base leading-[1.5625rem] text-muted-foreground">
            {t(`${key}A`, values)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
