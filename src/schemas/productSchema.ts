import { z } from 'zod'
import { SELLER_RULES } from '@/components/seller/sellerEarnings'
import type { FileKind, ProductStatus, RevisionStatus } from '@/generated/prisma/enums'

// As mensagens são chaves do namespace `errors` (src/messages/<locale>/errors.json).

export const STYLE_OPTIONS = [
  'Rock clássico',
  'Hard rock',
  'Metal moderno',
  'Blues',
  'Funk / Fusion',
  'Worship',
  'Pop',
  'Jazz',
  'Indie',
  'Ambient',
] as const

export const PRODUCT_KINDS = ['PRESET', 'IR', 'CAPTURE', 'OTHER'] as const
export const CAPTURE_KINDS = ['AMP', 'AMP_CAB', 'PEDAL', 'OTHER'] as const

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])

// Hostname exato (não "termina com"): "youtube.com.evil.com" não passa.
export function isYoutubeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
    )
  } catch {
    return false
  }
}

const MAX_STYLES = 3

/** Teto do preço de um produto: R$ 100.000,00. */
export const MAX_PRICE_CENTS = 100_000_00

// Rascunho: tudo opcional, só limita tamanho e formato. O que é obrigatório
// para enviar à análise fica em `productSubmitSchema`.
export const productDraftSchema = z
  .object({
    kinds: z.array(z.enum(PRODUCT_KINDS)).max(4).default([]),
    kindOther: z.string().trim().max(60).optional(),
    title: z.string().trim().max(80).default(''),
    shortDescription: z.string().trim().max(120).default(''),
    // "Sobre o pack" (vira `description` no banco)
    about: z.string().trim().max(4000).default(''),
    includes: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
    styles: z.array(z.enum(STYLE_OPTIONS)).max(MAX_STYLES).default([]),
    styleOther: z.string().trim().max(40).optional(),
    capturedAmp: z.string().trim().max(80).optional(),
    captureKind: z.enum(CAPTURE_KINDS).optional(),
    captureKindOther: z.string().trim().max(60).optional(),
    youtubeUrl: z
      .url()
      .refine(isYoutubeUrl, 'youtubeInvalid')
      .optional()
      .or(z.literal('')),
    priceCents: z.int().min(0).max(MAX_PRICE_CENTS, 'priceTooHigh').default(0),
    free: z.boolean().default(false),
  })
  .refine((draft) => draft.styles.length + (draft.styleOther ? 1 : 0) <= MAX_STYLES, {
    message: 'tooManyStyles',
    path: ['styles'],
  })

/** O que o form manda (campos com default são opcionais). */
export type ProductDraftInput = z.input<typeof productDraftSchema>
/** O rascunho já normalizado pelo schema. */
export type ProductDraft = z.output<typeof productDraftSchema>

export const productSubmitSchema = productDraftSchema.superRefine((draft, ctx) => {
  if (draft.kinds.length < 1) {
    ctx.addIssue({ code: 'custom', message: 'kindsRequired', path: ['kinds'] })
  }
  if (draft.kinds.includes('OTHER') && !draft.kindOther) {
    ctx.addIssue({ code: 'custom', message: 'kindOtherRequired', path: ['kindOther'] })
  }
  if (draft.title.length < 3) {
    ctx.addIssue({ code: 'custom', message: 'titleTooShort', path: ['title'] })
  }
  if (draft.shortDescription.length < 10) {
    ctx.addIssue({
      code: 'custom',
      message: 'shortDescriptionTooShort',
      path: ['shortDescription'],
    })
  }
  if (!draft.free && draft.priceCents < SELLER_RULES.minPriceCents) {
    ctx.addIssue({ code: 'custom', message: 'priceBelowMinimum', path: ['priceCents'] })
  }
})

// ---------------------------------------------------------------------------
// Checklist de envio e status da lista (puros, usados no server e no client)
// ---------------------------------------------------------------------------

export type ChecklistItem = { id: 'basics' | 'files' | 'price'; ok: boolean }

/**
 * Itens do "antes de enviar". Usa o próprio `productSubmitSchema` como fonte
 * da verdade: erro em `priceCents` reprova o preço; qualquer outro erro
 * (tipo, nome, descrição, formato) reprova o básico.
 */
export function submitChecklist(
  draft: ProductDraftInput,
  deliverableCount: number,
): ChecklistItem[] {
  const result = productSubmitSchema.safeParse(draft)
  const issues = result.success ? [] : result.error.issues
  const priceFails = issues.some((issue) => issue.path[0] === 'priceCents')
  const basicsFails = issues.some((issue) => issue.path[0] !== 'priceCents')
  return [
    { id: 'basics', ok: !basicsFails },
    { id: 'files', ok: deliverableCount >= 1 },
    { id: 'price', ok: !priceFails },
  ]
}

export type ListStatus = 'published' | 'review' | 'draft' | 'rejected'

/**
 * Status mostrado na lista do vendedor. A revisão mais recente manda (uma
 * edição de produto publicado em análise aparece como "em análise");
 * arquivado fica fora da lista.
 */
export function listStatusOf(
  product: { status: ProductStatus },
  latest: { status: RevisionStatus } | null,
): ListStatus | null {
  if (product.status === 'ARCHIVED') return null
  if (latest?.status === 'PENDING_REVIEW') return 'review'
  if (latest?.status === 'REJECTED') return 'rejected'
  switch (product.status) {
    case 'PUBLISHED':
      return 'published'
    case 'PENDING_REVIEW':
      return 'review'
    case 'REJECTED':
      return 'rejected'
    default:
      return 'draft'
  }
}

/** Em análise o produto fica só leitura. */
export function isEditable(status: ListStatus): boolean {
  return status !== 'review'
}

// ---------------------------------------------------------------------------
// Arquivos do produto (upload assinado direto para o R2)
// ---------------------------------------------------------------------------

export const FILE_KINDS = [
  'DELIVERABLE',
  'PREVIEW_AUDIO',
  'COVER_IMAGE',
] as const satisfies readonly FileKind[]

const MB = 1024 * 1024

/**
 * Limites por tipo de arquivo. `DELIVERABLE` vai para o bucket privado e
 * nunca ganha URL pública; prévia e capa vão para o público. Sem limite de
 * duração na prévia — só tamanho. Isomórfico: o form usa para validar antes
 * de pedir a URL.
 */
export const FILE_RULES: Record<
  FileKind,
  {
    maxBytes: number
    contentTypes: string[] | 'any'
    maxCount: number
    public: boolean
  }
> = {
  DELIVERABLE: { maxBytes: 200 * MB, contentTypes: 'any', maxCount: 20, public: false },
  PREVIEW_AUDIO: {
    maxBytes: 50 * MB,
    // audio/mp3: o que alguns navegadores no Windows informam para .mp3
    contentTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'],
    maxCount: 1,
    public: true,
  },
  COVER_IMAGE: {
    maxBytes: 5 * MB,
    contentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxCount: 1,
    public: true,
  },
}

export type UploadCheck = 'ok' | 'typeNotAllowed' | 'tooLarge' | 'empty'

// "Image/PNG; charset=x" -> "image/png"
export function normalizeContentType(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() ?? ''
}

export function validateUpload(
  kind: FileKind,
  contentType: string,
  sizeBytes: number,
): UploadCheck {
  const { contentTypes, maxBytes } = FILE_RULES[kind]
  if (
    contentTypes !== 'any' &&
    !contentTypes.includes(normalizeContentType(contentType))
  ) {
    return 'typeNotAllowed'
  }
  if (sizeBytes <= 0) return 'empty'
  if (sizeBytes > maxBytes) return 'tooLarge'
  return 'ok'
}

const fileKindSchema = z.enum(FILE_KINDS)
const uploadProductIdSchema = z.string().trim().min(1).max(64)
const fileNameSchema = z.string().trim().min(1).max(200)

export const productUploadSchema = z.object({
  productId: uploadProductIdSchema,
  kind: fileKindSchema,
  fileName: fileNameSchema,
  // o navegador manda '' quando não reconhece a extensão (.hlx, .syx…)
  contentType: z
    .string()
    .trim()
    .max(127)
    .transform((value) => normalizeContentType(value) || 'application/octet-stream')
    .pipe(z.string().regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/)),
  // limite por tipo fica em `validateUpload` (mensagem específica)
  sizeBytes: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
})
export type ProductUploadInput = z.input<typeof productUploadSchema>

export const confirmProductUploadSchema = z.object({
  productId: uploadProductIdSchema,
  kind: fileKindSchema,
  key: z.string().trim().min(1).max(512),
  fileName: fileNameSchema,
})
export type ConfirmProductUploadInput = z.input<typeof confirmProductUploadSchema>
