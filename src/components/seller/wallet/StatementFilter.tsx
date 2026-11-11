import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { WALLET_FILTERS, type WalletFilter } from './walletFilter'

const BASE_PATH = '/seller/wallet'

function hrefFor(filter: WalletFilter) {
  return filter === 'all' ? BASE_PATH : `${BASE_PATH}?filtro=${filter}`
}

// Pílulas do extrato. Cada uma é um link: o filtro vive na URL e a página
// filtra no servidor.
export function StatementFilter({ current }: { current: WalletFilter }) {
  const t = useTranslations('seller.wallet.filter')

  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
      <legend className="sr-only">{t('group')}</legend>
      {WALLET_FILTERS.map((filter) => {
        const active = filter === current
        return (
          <Link
            key={filter}
            href={hrefFor(filter)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full border px-4 text-[0.8125rem] leading-none font-semibold outline-none focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2',
              active
                ? 'border-azul bg-azul text-white'
                : 'border-ardosia/35 bg-field text-foreground hover:bg-muted',
            )}
          >
            {t(filter)}
          </Link>
        )
      })}
    </fieldset>
  )
}
