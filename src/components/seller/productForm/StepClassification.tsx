'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CAPTURE_KINDS, STYLE_OPTIONS } from '@/schemas/productSchema'
import { CARD, chipClass, FIELD, H2, HELP, INPUT, LABEL, SUB } from './formStyles'
import { MAX_STYLES, type WizardDraft } from './wizardSteps'

// Etapa 2: estilos (até 3, com "Outro" livre) e, se o pack tem Capture,
// os detalhes da captura.
export function StepClassification({
  draft,
  onChange,
}: {
  draft: WizardDraft
  onChange: (patch: Partial<WizardDraft>) => void
}) {
  const t = useTranslations('seller.productForm.classification')
  const tf = useTranslations('seller.productForm')
  const id = useId()
  const count = draft.styles.length + (draft.styleOtherOn ? 1 : 0)
  const full = count >= MAX_STYLES

  function toggleStyle(style: WizardDraft['styles'][number]) {
    onChange({
      styles: draft.styles.includes(style)
        ? draft.styles.filter((value) => value !== style)
        : [...draft.styles, style],
    })
  }

  return (
    <>
      <section className={CARD} aria-labelledby={`${id}-style`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={`${id}-style`} className={H2}>
              {t('styleTitle')}{' '}
              <span className="font-normal text-ardosia">{tf('optional')}</span>
            </h2>
            <p className={SUB}>{t('styleText')}</p>
          </div>
          <span className="flex-none rounded-full bg-background px-2.5 py-1 text-xs font-bold text-ardosia tabular-nums">
            {t('styleCount', { count, max: MAX_STYLES })}
          </span>
        </div>
        <fieldset
          aria-labelledby={`${id}-style`}
          className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
        >
          {STYLE_OPTIONS.map((style) => {
            const on = draft.styles.includes(style)
            return (
              <button
                key={style}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggleStyle(style)}
                className={chipClass(on)}
              >
                {style}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={draft.styleOtherOn}
            disabled={!draft.styleOtherOn && full}
            onClick={() => onChange({ styleOtherOn: !draft.styleOtherOn })}
            className={chipClass(draft.styleOtherOn)}
          >
            {t('styleOtherChip')}
          </button>
        </fieldset>
        {draft.styleOtherOn ? (
          <div className={FIELD}>
            <label htmlFor={`${id}-styleOther`} className={LABEL}>
              {t('styleOther')}
            </label>
            <Input
              id={`${id}-styleOther`}
              value={draft.styleOther}
              maxLength={40}
              placeholder={t('styleOtherPlaceholder')}
              aria-describedby={`${id}-styleOther-help`}
              onChange={(event) => onChange({ styleOther: event.target.value })}
              className={INPUT}
            />
            <p id={`${id}-styleOther-help`} className={HELP}>
              {t('styleOtherHelp')}
            </p>
          </div>
        ) : null}
      </section>

      {draft.kinds.includes('CAPTURE') ? (
        <section className={CARD} aria-labelledby={`${id}-capture`}>
          <div className="flex flex-col gap-1">
            <p className="type-eyebrow text-azul">{t('captureEyebrow')}</p>
            <h2 id={`${id}-capture`} className={H2}>
              {t('captureTitle')}
            </h2>
          </div>
          <div className={FIELD}>
            <label htmlFor={`${id}-amp`} className={LABEL}>
              {t('capturedAmp')}
            </label>
            <Input
              id={`${id}-amp`}
              value={draft.capturedAmp}
              maxLength={80}
              placeholder={t('capturedAmpPlaceholder')}
              aria-describedby={`${id}-amp-help`}
              onChange={(event) => onChange({ capturedAmp: event.target.value })}
              className={INPUT}
            />
            <p id={`${id}-amp-help`} className={HELP}>
              {t('capturedAmpHelp')}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label={t('captureKind')}
            className="flex flex-wrap gap-2"
          >
            {CAPTURE_KINDS.map((kind) => {
              const on = draft.captureKind === kind
              return (
                // biome-ignore lint/a11y/useSemanticElements: chip com aparência de botão, como no canvas
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange({ captureKind: kind })}
                  className={chipClass(on)}
                >
                  {t(`captureKinds.${kind}`)}
                </button>
              )
            })}
          </div>
          {draft.captureKind === 'OTHER' ? (
            <Input
              aria-label={t('captureKindOther')}
              value={draft.captureKindOther}
              maxLength={60}
              placeholder={t('captureKindOtherPlaceholder')}
              onChange={(event) => onChange({ captureKindOther: event.target.value })}
              className={cn(INPUT)}
            />
          ) : null}
        </section>
      ) : null}
    </>
  )
}
