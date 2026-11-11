import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { SITUACOES, type Situacao } from './productListFilter'

const BASE_PATH = '/seller/products'

function hrefFor(situacao: Situacao, query: string) {
  const params = new URLSearchParams()
  if (situacao !== 'all') params.set('situacao', situacao)
  if (query) params.set('q', query)
  const search = params.toString()
  return search ? `${BASE_PATH}?${search}` : BASE_PATH
}

// Pílulas de situação da lista de produtos. Cada uma é um link (a situação
// vive na URL e a página filtra no servidor); a busca atual é mantida.
export function StatusFilter({
  counts,
  current,
  query = '',
}: {
  counts: Record<Situacao, number>
  current: Situacao
  query?: string
}) {
  const t = useTranslations('seller.products.filter')

  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{t('group')}</legend>
      {SITUACOES.map((situacao) => {
        const active = situacao === current
        return (
          <Link
            key={situacao}
            href={hrefFor(situacao, query)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.8125rem] leading-none font-semibold outline-none focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2',
              active
                ? 'border-azul bg-azul text-white'
                : 'border-ardosia/35 bg-field text-foreground hover:bg-muted',
            )}
          >
            {t(situacao)}
            <span className="tabular-nums opacity-75">{counts[situacao]}</span>
          </Link>
        )
      })}
    </fieldset>
  )
}
