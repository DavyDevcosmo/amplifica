'use client'

import { ImageIcon, UploadIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  confirmProductUploadAction,
  removeProductFileAction,
  requestProductUploadAction,
} from '@/actions/productActions'
import type { FileKind } from '@/generated/prisma/enums'
import { cn, formatFileSize } from '@/lib/utils'
import { FILE_RULES, validateUpload } from '@/schemas/productSchema'
import type { ProductEditData } from '@/server/queries/productQueries'
import { FOCUS, LABEL } from './formStyles'
import { PreviewPlayer } from './PreviewPlayer'

type ProductFile = ProductEditData['files'][number]

const UPLOAD_ERRORS = {
  typeNotAllowed: 'seller.fileTypeNotAllowed',
  tooLarge: 'seller.fileTooLarge',
  empty: 'seller.fileEmpty',
} as const

// PUT direto na URL assinada do R2, com progresso. O Content-Type tem que
// ser exatamente o que foi assinado em `requestProductUploadAction`.
function putFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(String(xhr.status)))
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(file)
  })
}

const COPY: Record<FileKind, { label: string; button: string; hint: string }> = {
  DELIVERABLE: {
    label: 'deliverable',
    button: 'deliverableButton',
    hint: 'deliverableHint',
  },
  PREVIEW_AUDIO: { label: 'preview', button: 'previewButton', hint: 'previewHint' },
  COVER_IMAGE: { label: 'cover', button: 'coverButton', hint: 'coverHint' },
}

const ACCEPT: Record<FileKind, string | undefined> = {
  DELIVERABLE: undefined,
  PREVIEW_AUDIO: (FILE_RULES.PREVIEW_AUDIO.contentTypes as string[]).join(','),
  COVER_IMAGE: (FILE_RULES.COVER_IMAGE.contentTypes as string[]).join(','),
}

/**
 * Envio de um tipo de arquivo do produto: pede a URL assinada, faz o PUT com
 * barra de progresso, confirma e recarrega os dados da página. Pack aceita
 * vários arquivos; prévia e capa, um (remova para trocar).
 */
export function FileUploader({
  productId,
  kind,
  files,
  disabled,
  optional = false,
  help,
}: {
  productId: string
  kind: FileKind
  files: ProductFile[]
  disabled: boolean
  optional?: boolean
  help?: string
}) {
  const t = useTranslations('seller.productForm')
  const tErrors = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [upload, setUpload] = useState<{ name: string; percent: number } | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const copy = COPY[kind]
  const multiple = FILE_RULES[kind].maxCount > 1
  const single = !multiple ? files[0] : undefined
  const busy = upload !== null || removing !== null
  const blocked = disabled || unavailable

  async function uploadOne(file: File): Promise<boolean> {
    const contentType = file.type || 'application/octet-stream'
    const check = validateUpload(kind, contentType, file.size)
    if (check !== 'ok') {
      toast.error(tErrors(UPLOAD_ERRORS[check]), { description: file.name })
      return false
    }
    setUpload({ name: file.name, percent: 0 })
    const signed = await requestProductUploadAction({
      productId,
      kind,
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    })
    if (!signed.success) {
      if (signed.code === 'UPLOADS_UNAVAILABLE') setUnavailable(true)
      toast.error(signed.error, { description: file.name })
      return false
    }
    try {
      await putFile(signed.data.url, file, contentType, (percent) =>
        setUpload({ name: file.name, percent }),
      )
    } catch {
      toast.error(t('files.uploadFailed'), { description: file.name })
      return false
    }
    const confirmed = await confirmProductUploadAction({
      productId,
      kind,
      key: signed.data.key,
      fileName: file.name,
    })
    if (!confirmed.success) {
      toast.error(confirmed.error, { description: file.name })
      return false
    }
    return true
  }

  async function handleFiles(list: FileList | null) {
    const picked = Array.from(list ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (picked.length === 0) return
    let any = false
    try {
      for (const file of picked) {
        // action ou rede pode lançar: avisa e segue para o próximo arquivo
        try {
          if (await uploadOne(file)) any = true
        } catch {
          toast.error(t('files.uploadFailed'), { description: file.name })
        }
      }
    } finally {
      setUpload(null)
    }
    if (any) router.refresh()
  }

  async function remove(file: ProductFile) {
    setRemoving(file.id)
    try {
      const result = await removeProductFileAction(file.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.refresh()
    } catch {
      toast.error(tErrors('actionFailed'))
    } finally {
      setRemoving(null)
    }
  }

  const removeButton = (file: ProductFile, tone: 'light' | 'dark' = 'light') => (
    <button
      type="button"
      aria-label={t('files.remove', { name: file.fileName })}
      disabled={disabled || busy}
      onClick={() => remove(file)}
      className={cn(
        'grid size-10 flex-none place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-50',
        FOCUS,
        tone === 'light'
          ? 'text-ardosia hover:bg-ardosia/10'
          : 'bg-white/90 text-preto hover:bg-white',
      )}
    >
      <XIcon aria-hidden className="size-4" />
    </button>
  )

  const showPicker = multiple || !single

  return (
    <div className="flex flex-col gap-2.5">
      <span id={`${id}-label`} className={LABEL}>
        {t(`files.${copy.label}`)}
        {optional ? (
          <span className="font-normal text-ardosia"> {t('optional')}</span>
        ) : null}
      </span>

      {showPicker ? (
        <>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            multiple={multiple}
            accept={ACCEPT[kind]}
            onChange={(event) => handleFiles(event.target.files)}
          />
          <button
            type="button"
            disabled={blocked || busy}
            aria-describedby={`${id}-label`}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-tile border-[1.5px] border-dashed text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60',
              FOCUS,
              kind === 'COVER_IMAGE'
                ? 'min-h-24 flex-row gap-2.5 border-ardosia/45 bg-background text-marinho dark:text-foreground'
                : 'min-h-30 border-azul/55 bg-azul/5 text-azul-forte dark:text-azul-claro',
            )}
          >
            {kind === 'COVER_IMAGE' ? (
              <ImageIcon aria-hidden className="size-5" />
            ) : (
              <UploadIcon aria-hidden className="size-5.5" />
            )}
            {t(`files.${copy.button}`)}
            {kind !== 'COVER_IMAGE' ? (
              <span className="text-xs font-normal text-ardosia">
                {t(`files.${copy.hint}`)}
              </span>
            ) : null}
          </button>
        </>
      ) : null}

      {upload ? (
        <div className="flex flex-col gap-1.5">
          <span className="truncate text-xs text-ardosia">
            {t('files.uploading', { name: upload.name })}
          </span>
          <div
            role="progressbar"
            aria-label={t('files.uploading', { name: upload.name })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={upload.percent}
            className="h-1.5 overflow-hidden rounded-full bg-ardosia/20"
          >
            <div
              className="h-full bg-azul transition-[width] motion-reduce:transition-none"
              style={{ width: `${upload.percent}%` }}
            />
          </div>
        </div>
      ) : null}

      {multiple && files.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-background py-1 pr-1 pl-3.5 text-[0.8125rem]"
            >
              <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
              <span className="flex-none text-ardosia tabular-nums">
                {formatFileSize(file.sizeBytes, locale)}
              </span>
              {removeButton(file)}
            </li>
          ))}
        </ul>
      ) : null}

      {single && kind === 'PREVIEW_AUDIO' ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <PreviewPlayer
              url={single.url}
              fileName={single.fileName}
              detail={formatFileSize(single.sizeBytes, locale)}
            />
          </div>
          {removeButton(single)}
        </div>
      ) : null}

      {single && kind === 'COVER_IMAGE' ? (
        <div className="relative aspect-16/10 overflow-hidden rounded-tile bg-linear-135 from-ardosia to-celeste">
          {single.url ? (
            // biome-ignore lint/performance/noImgElement: URL pública do R2, sem otimização do Next
            <img
              src={single.url}
              alt={t('files.coverAlt')}
              className="size-full object-cover"
            />
          ) : (
            <span className="absolute inset-x-3 bottom-3 truncate text-xs text-white">
              {single.fileName}
            </span>
          )}
          <span className="absolute top-2 right-2">{removeButton(single, 'dark')}</span>
        </div>
      ) : null}

      {help ? (
        <p className="text-[0.8125rem] leading-[1.1875rem] text-ardosia">{help}</p>
      ) : null}
    </div>
  )
}
