import { useLocale, useTranslations } from 'next-intl'
import { formatBrasiliaShortDate } from '@/lib/brasiliaTime'
import { formatCurrency } from '@/lib/utils'

// Mesmo formato de `Release` (walletService), declarado aqui para o componente
// não importar código de servidor.
export type ReleaseRow = {
  dayKey: string
  date: Date
  amountCents: number
  count: number
}

// Próximas liberações de saldo retido, por dia. No celular são 3 lado a lado
// (o 4º some); no desktop os itens se ajustam à largura.
export function Releases({ releases }: { releases: ReleaseRow[] }) {
  const t = useTranslations('seller.wallet.releases')
  const locale = useLocale()

  return (
    <section
      aria-labelledby="wallet-releases-title"
      className="flex flex-col gap-4 rounded-card bg-card p-6"
    >
      <h2
        id="wallet-releases-title"
        className="font-sans text-base font-bold normal-case [font-stretch:100%]"
      >
        {t('title')}
      </h2>
      {releases.length === 0 ? (
        <p className="text-[0.9375rem] leading-[1.375rem] text-ardosia">{t('empty')}</p>
      ) : (
        <ol className="m-0 grid list-none grid-cols-3 gap-2 p-0 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] md:gap-3">
          {releases.map((release) => (
            <li
              key={release.dayKey}
              className="flex min-w-0 flex-col gap-1 rounded-tile bg-background px-2.5 py-3 max-md:[&:nth-child(n+4)]:hidden md:p-4"
            >
              <span className="text-[0.8125rem] font-semibold text-ardosia">
                {formatBrasiliaShortDate(release.date, locale)}
              </span>
              <span className="font-display text-sm tracking-tight tabular-nums [overflow-wrap:anywhere] [font-stretch:100%] md:text-xl md:tracking-normal md:[font-stretch:125%]">
                {formatCurrency(release.amountCents, { locale })}
              </span>
              <span className="text-xs text-ardosia">
                {t('count', { count: release.count })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
