'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PRODUCT_KINDS } from '@/schemas/productSchema'
import { CARD, FIELD, FOCUS, H2, HELP, INPUT, LABEL, SUB, TEXTAREA } from './formStyles'
import { SHORT_DESCRIPTION_MAX, type WizardDraft } from './wizardSteps'

const MAX_INCLUDES = 20

// Etapa 1: o que é (tipos do pack) e sobre o produto (nome, descrição curta,
// texto longo e a lista do que vem no pack).
export function StepInfo({
  draft,
  onChange,
}: {
  draft: WizardDraft
  onChange: (patch: Partial<WizardDraft>) => void
}) {
  const t = useTranslations('seller.productForm.info')
  const id = useId()
  const [newItem, setNewItem] = useState('')

  function toggleKind(kind: WizardDraft['kinds'][number]) {
    onChange({
      kinds: draft.kinds.includes(kind)
        ? draft.kinds.filter((value) => value !== kind)
        : [...draft.kinds, kind],
    })
  }

  function addItem() {
    const item = newItem.trim()
    setNewItem('')
    if (!item || draft.includes.length >= MAX_INCLUDES) return
    onChange({ includes: [...draft.includes, item] })
  }

  return (
    <>
      <section className={CARD} aria-labelledby={`${id}-kind`}>
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-kind`} className={H2}>
            {t('kindTitle')}
          </h2>
          <p className={SUB}>{t('kindText')}</p>
        </div>
        <fieldset
          aria-labelledby={`${id}-kind`}
          className="m-0 grid min-w-0 grid-cols-1 gap-2.5 border-0 p-0 md:grid-cols-2 md:gap-3"
        >
          {PRODUCT_KINDS.map((kind) => {
            const on = draft.kinds.includes(kind)
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={on}
                onClick={() => toggleKind(kind)}
                className={cn(
                  'relative flex flex-col gap-1 rounded-tile border-[1.5px] py-4 pr-11 pl-4 text-left disabled:cursor-not-allowed',
                  FOCUS,
                  on
                    ? 'border-azul bg-azul/6'
                    : 'border-ardosia/30 bg-card hover:border-ardosia/50',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-3.5 right-3.5 grid size-5.5 place-items-center rounded-md border-[1.5px] text-white',
                    on ? 'border-azul bg-azul' : 'border-ardosia/50 bg-card',
                  )}
                >
                  {on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
                </span>
                <strong className="text-[0.9375rem]">{t(`kinds.${kind}.label`)}</strong>
                <span className="text-[0.8125rem] leading-[1.125rem] text-ardosia">
                  {t(`kinds.${kind}.text`)}
                </span>
              </button>
            )
          })}
        </fieldset>
        {draft.kinds.includes('OTHER') ? (
          <div className={FIELD}>
            <label htmlFor={`${id}-kindOther`} className={LABEL}>
              {t('kindOther')}
            </label>
            <Input
              id={`${id}-kindOther`}
              value={draft.kindOther}
              maxLength={60}
              placeholder={t('kindOtherPlaceholder')}
              aria-describedby={`${id}-kindOther-help`}
              onChange={(event) => onChange({ kindOther: event.target.value })}
              className={INPUT}
            />
            <p id={`${id}-kindOther-help`} className={HELP}>
              {t('kindOtherHelp')}
            </p>
          </div>
        ) : null}
      </section>

      <section className={CARD} aria-labelledby={`${id}-about`}>
        <h2 id={`${id}-about`} className={H2}>
          {t('aboutTitle')}
        </h2>
        <div className={FIELD}>
          <label htmlFor={`${id}-title`} className={LABEL}>
            {t('title')}
          </label>
          <Input
            id={`${id}-title`}
            value={draft.title}
            maxLength={80}
            placeholder={t('titlePlaceholder')}
            onChange={(event) => onChange({ title: event.target.value })}
            className={INPUT}
          />
        </div>
        <div className={FIELD}>
          <label htmlFor={`${id}-short`} className={LABEL}>
            {t('shortDescription')}
          </label>
          <Input
            id={`${id}-short`}
            value={draft.shortDescription}
            maxLength={SHORT_DESCRIPTION_MAX}
            placeholder={t('shortDescriptionPlaceholder')}
            aria-describedby={`${id}-short-count`}
            onChange={(event) => onChange({ shortDescription: event.target.value })}
            className={INPUT}
          />
          <p id={`${id}-short-count`} className={cn(HELP, 'tabular-nums')}>
            {t('shortDescriptionCount', {
              count: draft.shortDescription.length,
              max: SHORT_DESCRIPTION_MAX,
            })}
          </p>
        </div>
        <div className={FIELD}>
          <label htmlFor={`${id}-aboutText`} className={LABEL}>
            {t('about')}
          </label>
          <Textarea
            id={`${id}-aboutText`}
            rows={5}
            value={draft.about}
            maxLength={4000}
            placeholder={t('aboutPlaceholder')}
            onChange={(event) => onChange({ about: event.target.value })}
            className={TEXTAREA}
          />
        </div>
        <fieldset
          aria-labelledby={`${id}-includes`}
          className={cn(FIELD, 'm-0 min-w-0 border-0 p-0')}
        >
          <span id={`${id}-includes`} className={LABEL}>
            {t('includes')}
          </span>
          {draft.includes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {draft.includes.map((item, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: itens não têm id e podem repetir
                  key={`${index}-${item}`}
                  className="flex min-h-12 items-center gap-2.5 rounded-xl bg-background py-0 pr-2 pl-4 text-[0.9375rem]"
                >
                  <span className="min-w-0 flex-1 break-words">{item}</span>
                  <button
                    type="button"
                    aria-label={t('includeRemove', { item })}
                    onClick={() =>
                      onChange({
                        includes: draft.includes.filter((_, i) => i !== index),
                      })
                    }
                    className={cn(
                      'grid size-10 flex-none place-items-center rounded-full text-ardosia hover:bg-ardosia/10',
                      FOCUS,
                    )}
                  >
                    <XIcon aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={t('includeNew')}
              value={newItem}
              maxLength={120}
              placeholder={t('includeNewPlaceholder')}
              onChange={(event) => setNewItem(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addItem()
                }
              }}
              className={INPUT}
            />
            <Button
              type="button"
              variant="outline-strong"
              onClick={addItem}
              disabled={draft.includes.length >= MAX_INCLUDES}
              className="h-11 shrink-0 rounded-full px-5 type-label text-marinho md:h-11 dark:text-foreground"
            >
              {t('includeAdd')}
            </Button>
          </div>
        </fieldset>
      </section>
    </>
  )
}
