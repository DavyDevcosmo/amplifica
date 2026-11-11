import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ListStatus } from '@/schemas/productSchema'

const TONES: Record<ListStatus, string> = {
  published: 'bg-success/12 text-success',
  review: 'bg-azul/10 text-azul-forte dark:bg-azul/20 dark:text-azul-claro',
  draft: 'bg-creme text-ardosia dark:bg-muted dark:text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive-strong',
}

// Situação de um produto na lista do vendedor (publicado, em análise,
// rascunho ou recusado). Par do `StatusBadge`, que cuida das vendas.
export function ProductStatusBadge({
  status,
  className,
}: {
  status: ListStatus
  className?: string
}) {
  const t = useTranslations('seller.products.status')
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.75 text-xs font-bold whitespace-nowrap md:px-3 md:py-1',
        TONES[status],
        className,
      )}
    >
      {t(status)}
    </span>
  )
}
