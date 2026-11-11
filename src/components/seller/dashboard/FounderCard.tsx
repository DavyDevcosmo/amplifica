import { useTranslations } from 'next-intl'
import { FounderSeal } from '@/components/product/FounderSeal'
import { COMMISSION_PERCENT } from '@/components/seller/sellerEarnings'
import type { FounderStatus } from './founderStatus'

// Programa Fundador: vendas isentas usadas e o que falta. Sem data de início
// configurada, a parte dos dias é omitida.
export function FounderCard({ status }: { status: FounderStatus }) {
  const t = useTranslations('seller.dashboard.founder')
  const { used, total, remainingSales, daysLeft } = status
  const ended = remainingSales === 0 || daysLeft === 0
  const percent = COMMISSION_PERCENT

  const note = ended
    ? t('ended', { percent })
    : daysLeft === null
      ? t('remaining', { sales: remainingSales, percent })
      : t('remainingWithDays', { sales: remainingSales, days: daysLeft, percent })

  return (
    <section
      aria-labelledby="founder-card-title"
      className="flex flex-col gap-3.5 rounded-card bg-card p-6"
    >
      <div className="flex items-center gap-2.5">
        <FounderSeal className="size-6" />
        <h2
          id="founder-card-title"
          className="font-sans text-base font-bold normal-case [font-stretch:100%]"
        >
          {t('title')}
        </h2>
      </div>
      <p className="text-[0.9375rem] leading-[1.375rem]">
        {t.rich('used', {
          used,
          total,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-celeste"
          style={{ width: `${(used / total) * 100}%` }}
        />
      </div>
      <p className="text-[0.8125rem] leading-[1.1875rem] text-muted-foreground">
        {note}
      </p>
    </section>
  )
}
