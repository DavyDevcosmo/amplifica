'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { WIZARD_STEPS, type WizardStep } from './wizardSteps'

const BUTTON = 'h-12 rounded-full px-5 type-label md:h-12 lg:px-6'

// Barra de ações do formulário. No celular fica grudada no rodapé, com os
// botões dividindo a largura; de `lg` para cima vira um cartão com
// "Etapa N de 5".
export function WizardNavBar({
  step,
  readOnly,
  pending,
  canSubmit,
  blockedText,
  onBack,
  onSaveDraft,
  onNext,
  onSubmit,
}: {
  step: WizardStep
  readOnly: boolean
  pending: boolean
  canSubmit: boolean
  /** "Para enviar falta: …" (só na última etapa, com checklist incompleto) */
  blockedText: string | null
  onBack: () => void
  onSaveDraft: () => void
  onNext: () => void
  onSubmit: () => void
}) {
  const t = useTranslations('seller.productForm')
  const isLast = step === WIZARD_STEPS.length

  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-ardosia/20 bg-card px-4 py-3 md:-mx-8 md:px-8 lg:static lg:mx-0 lg:rounded-card lg:border-0 lg:px-5 lg:py-4">
      {isLast && !readOnly && blockedText ? (
        <p className="text-[0.8125rem] leading-[1.1875rem] text-destructive-strong">
          {blockedText}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2.5 lg:gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline-strong"
            onClick={onBack}
            disabled={pending}
            className={cn(
              BUTTON,
              'flex-1 text-marinho lg:flex-none dark:text-foreground',
            )}
          >
            {t('nav.back')}
          </Button>
        ) : null}
        {!readOnly ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveDraft}
            disabled={pending}
            className={cn(BUTTON, 'order-last basis-full lg:order-none lg:basis-auto')}
          >
            {t('nav.saveDraft')}
          </Button>
        ) : null}
        <span aria-hidden className="hidden flex-1 lg:block" />
        <span className="hidden text-[0.8125rem] text-ardosia lg:inline">
          {t('steps.stepOf', { n: step, total: WIZARD_STEPS.length })}
        </span>
        {!isLast ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={pending}
            className={cn(BUTTON, 'flex-2 bg-azul hover:bg-azul-forte lg:flex-none')}
          >
            {pending && !readOnly ? <Spinner aria-hidden /> : null}
            {t('nav.next')}
          </Button>
        ) : null}
        {isLast && !readOnly ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={pending || !canSubmit}
            className={cn(BUTTON, 'flex-2 bg-azul hover:bg-azul-forte lg:flex-none')}
          >
            {pending ? <Spinner aria-hidden /> : null}
            {t('nav.submit')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
