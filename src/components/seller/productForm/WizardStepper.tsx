'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { FOCUS } from './formStyles'
import type { WizardStep } from './wizardSteps'

export type StepperItem = {
  n: WizardStep
  label: string
  /** etapa anterior: concluída ou faltando algo; futuras não mostram estado */
  state: 'current' | 'done' | 'missing' | 'future'
}

// Etapas do cadastro. De `lg` para cima: cinco botões com número/✓, rótulo
// e estado. Abaixo: rótulo da etapa atual, "Etapa N de 5" e segmentos.
export function WizardStepper({
  steps,
  current,
  onGo,
  disabled = false,
}: {
  steps: StepperItem[]
  current: WizardStep
  onGo: (step: WizardStep) => void
  disabled?: boolean
}) {
  const t = useTranslations('seller.productForm.steps')
  const currentLabel = steps.find((step) => step.n === current)?.label

  return (
    <>
      <nav
        aria-label={t('nav')}
        className="flex flex-col gap-1 rounded-[18px] bg-card px-4 pt-3.5 pb-1.5 lg:hidden"
      >
        <div className="flex items-baseline justify-between gap-3">
          <strong className="text-base leading-[1.375rem]">{currentLabel}</strong>
          <span className="text-[0.8125rem] text-ardosia tabular-nums">
            {t('stepOf', { n: current, total: steps.length })}
          </span>
        </div>
        <ol className="grid grid-cols-5 gap-1.5">
          {steps.map((step) => (
            <li key={step.n}>
              <button
                type="button"
                aria-label={step.label}
                aria-current={step.state === 'current' ? 'step' : undefined}
                disabled={disabled}
                onClick={() => onGo(step.n)}
                className={cn('flex h-11 w-full items-center rounded-full', FOCUS)}
              >
                <span
                  className={cn(
                    'block h-1.5 w-full rounded-full',
                    step.state === 'current' && 'bg-azul',
                    step.state === 'done' && 'bg-celeste',
                    step.state === 'missing' && 'bg-destructive/45',
                    step.state === 'future' && 'bg-ardosia/22',
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <nav aria-label={t('nav')} className="hidden lg:block">
        <ol className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const active = step.state === 'current' || step.state === 'done'
            return (
              <li key={step.n}>
                <button
                  type="button"
                  aria-current={step.state === 'current' ? 'step' : undefined}
                  disabled={disabled}
                  onClick={() => onGo(step.n)}
                  className={cn(
                    'flex min-h-16 w-full items-center gap-3 rounded-tile border-[1.5px] px-3.5 py-2.5 text-left',
                    FOCUS,
                    step.state === 'current'
                      ? 'border-azul bg-azul/6'
                      : 'border-ardosia/20 bg-card hover:border-ardosia/40',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-8 flex-none place-items-center rounded-full border-[1.5px] text-sm font-bold',
                      active
                        ? 'border-azul bg-azul text-white'
                        : 'border-marinho/30 bg-card text-marinho dark:text-foreground',
                    )}
                  >
                    {step.state === 'done' ? '✓' : step.n}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <strong className="text-sm leading-[1.1875rem]">
                      {step.label}
                    </strong>
                    {step.state === 'done' ? (
                      <span className="text-xs leading-4 text-ardosia">
                        {t('done')}
                      </span>
                    ) : null}
                    {step.state === 'missing' ? (
                      <span className="text-xs leading-4 text-destructive-strong">
                        {t('missing')}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
