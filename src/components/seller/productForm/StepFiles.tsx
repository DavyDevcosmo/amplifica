'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { isYoutubeUrl } from '@/schemas/productSchema'
import type { ProductEditData } from '@/server/queries/productQueries'
import { FileUploader } from './FileUploader'
import { CARD, FIELD, H2, HELP, INPUT, LABEL, SUB } from './formStyles'
import type { WizardDraft } from './wizardSteps'

// Etapa 3: arquivos do pack (privados), prévia em áudio e capa (públicas) e
// o link do YouTube. Só existe com produto salvo (avançar da etapa 1 salva).
export function StepFiles({
  productId,
  files,
  youtubeUrl,
  onChange,
  readOnly,
  uploadsEnabled,
}: {
  productId: string
  files: ProductEditData['files']
  youtubeUrl: string
  onChange: (patch: Partial<WizardDraft>) => void
  readOnly: boolean
  uploadsEnabled: boolean
}) {
  const t = useTranslations('seller.productForm')
  const tErrors = useTranslations('errors')
  const id = useId()
  const ofKind = (kind: ProductEditData['files'][number]['kind']) =>
    files.filter((file) => file.kind === kind)
  const youtubeInvalid = youtubeUrl.trim() !== '' && !isYoutubeUrl(youtubeUrl.trim())
  const disabled = readOnly || !uploadsEnabled

  return (
    <>
      <section className={CARD} aria-labelledby={`${id}-files`}>
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-files`} className={H2}>
            {t('files.title')}
          </h2>
          <p className={SUB}>{t('files.text')}</p>
        </div>
        {!uploadsEnabled ? (
          <p
            role="status"
            className="rounded-xl bg-destructive/10 px-3.5 py-3 text-[0.8125rem] leading-[1.1875rem] text-destructive-strong"
          >
            {tErrors('seller.uploadsUnavailable')}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploader
            productId={productId}
            kind="DELIVERABLE"
            files={ofKind('DELIVERABLE')}
            disabled={disabled}
          />
          <FileUploader
            productId={productId}
            kind="PREVIEW_AUDIO"
            files={ofKind('PREVIEW_AUDIO')}
            disabled={disabled}
            optional
            help={t('files.previewHelp')}
          />
        </div>
        <FileUploader
          productId={productId}
          kind="COVER_IMAGE"
          files={ofKind('COVER_IMAGE')}
          disabled={disabled}
          optional
        />
      </section>

      <section className={CARD} aria-labelledby={`${id}-links`}>
        <h2 id={`${id}-links`} className={H2}>
          {t('files.linksTitle')}
        </h2>
        <div className={FIELD}>
          <label htmlFor={`${id}-youtube`} className={LABEL}>
            {t('files.youtube')}{' '}
            <span className="font-normal text-ardosia">{t('optional')}</span>
          </label>
          <Input
            id={`${id}-youtube`}
            type="url"
            inputMode="url"
            value={youtubeUrl}
            placeholder={t('files.youtubePlaceholder')}
            aria-invalid={youtubeInvalid}
            aria-describedby={`${id}-youtube-help`}
            onChange={(event) => onChange({ youtubeUrl: event.target.value })}
            className={cn(
              INPUT,
              youtubeInvalid && 'border-destructive aria-invalid:ring-0',
            )}
          />
          <p
            id={`${id}-youtube-help`}
            className={cn(
              HELP,
              youtubeInvalid && 'font-semibold text-destructive-strong',
            )}
          >
            {youtubeInvalid ? t('files.youtubeInvalid') : t('files.youtubeHelp')}
          </p>
        </div>
      </section>
    </>
  )
}
