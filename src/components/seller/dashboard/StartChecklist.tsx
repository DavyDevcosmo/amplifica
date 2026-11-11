import { CheckIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'profile', href: '/seller/profile' },
  { id: 'product', href: '/seller/products/new' },
  { id: 'receiving', href: '/seller/payouts' },
] as const

// Vendedor sem produto: três passos no lugar dos números. O primeiro passo
// pendente é o "atual" (aria-current) e leva o botão cheio.
export function StartChecklist({
  profileDone,
  productDone,
  receivingDone,
}: {
  profileDone: boolean
  productDone: boolean
  receivingDone: boolean
}) {
  const t = useTranslations('seller.dashboard.checklist')
  const done = { profile: profileDone, product: productDone, receiving: receivingDone }
  const currentId = STEPS.find((step) => !done[step.id])?.id

  return (
    <section
      aria-labelledby="start-checklist-title"
      className="flex flex-col gap-5 rounded-card bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id="start-checklist-title"
          className="font-display text-[1.375rem] leading-[1.1]"
        >
          {t('title')}
        </h2>
        <p className="text-[0.9375rem] leading-[1.375rem] text-muted-foreground">
          {t('lead')}
        </p>
      </div>
      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const isDone = done[step.id]
          const isCurrent = step.id === currentId
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/40 py-4"
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] text-sm font-bold',
                  isDone
                    ? 'border-azul bg-azul text-white'
                    : 'border-foreground/30 bg-card text-foreground',
                )}
              >
                {isDone ? (
                  <CheckIcon className="size-4" strokeWidth={2.6} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
                <strong className="text-[0.9375rem] leading-[1.375rem]">
                  {t(`${step.id}.title`)}
                </strong>
                <span className="text-sm leading-5 text-muted-foreground">
                  {t(`${step.id}.text`)}
                </span>
              </span>
              {isDone ? (
                <span className="text-[0.8125rem] font-semibold text-success">
                  {t('done')}
                </span>
              ) : (
                <Link
                  href={step.href}
                  className={cn(
                    'type-label inline-flex min-h-11 shrink-0 items-center rounded-full px-5 outline-none focus-visible:ring-2 focus-visible:ring-azul',
                    isCurrent
                      ? 'bg-azul text-white hover:bg-azul-forte'
                      : 'border-[1.5px] border-foreground/30 hover:bg-foreground/5',
                  )}
                >
                  {t(`${step.id}.cta`)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
