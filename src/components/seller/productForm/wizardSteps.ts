import { SELLER_RULES, saleBreakdown } from '@/components/seller/sellerEarnings'
import {
  type CAPTURE_KINDS,
  type PRODUCT_KINDS,
  type ProductDraftInput,
  type STYLE_OPTIONS,
  submitChecklist,
} from '@/schemas/productSchema'

export const WIZARD_STEPS = [
  { n: 1, key: 'info' },
  { n: 2, key: 'classification' },
  { n: 3, key: 'files' },
  { n: 4, key: 'price' },
  { n: 5, key: 'review' },
] as const

export type WizardStep = (typeof WIZARD_STEPS)[number]['n']
export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key']

export const MAX_STYLES = 3
export const SHORT_DESCRIPTION_MAX = 120

/** `?etapa=` da URL -> etapa (inválida ou ausente -> 1). */
export function parseStep(value: string | string[] | undefined): WizardStep {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  return WIZARD_STEPS.find((step) => step.n === n)?.n ?? 1
}

/**
 * Etapa completa para o stepper: 1 é o básico do checklist (tipo, nome,
 * descrição), 4 é o preço (ou gratuito). As outras são opcionais.
 */
export function stepComplete(
  step: WizardStep,
  draft: ProductDraftInput,
  deliverableCount: number,
): boolean {
  if (step === 2 || step === 3 || step === 5) return true
  const id = step === 1 ? 'basics' : 'price'
  return (
    submitChecklist(draft, deliverableCount).find((item) => item.id === id)?.ok ?? false
  )
}

type ProductKind = (typeof PRODUCT_KINDS)[number]
type CaptureKind = (typeof CAPTURE_KINDS)[number]
type Style = (typeof STYLE_OPTIONS)[number]

/**
 * Estado do formulário: tudo como string/array editável. "Outro" de estilo
 * é um chip ligado (`styleOtherOn`) com texto à parte.
 */
export type WizardDraft = {
  kinds: ProductKind[]
  kindOther: string
  title: string
  shortDescription: string
  about: string
  includes: string[]
  styles: Style[]
  styleOtherOn: boolean
  styleOther: string
  capturedAmp: string
  captureKind: CaptureKind | null
  captureKindOther: string
  youtubeUrl: string
  priceCents: number
  free: boolean
}

export function toWizardDraft(input: ProductDraftInput | undefined): WizardDraft {
  const draft = input ?? {}
  return {
    kinds: [...new Set(draft.kinds ?? [])],
    kindOther: draft.kindOther ?? '',
    title: draft.title ?? '',
    shortDescription: draft.shortDescription ?? '',
    about: draft.about ?? '',
    includes: draft.includes ?? [],
    styles: draft.styles ?? [],
    styleOtherOn: Boolean(draft.styleOther),
    styleOther: draft.styleOther ?? '',
    capturedAmp: draft.capturedAmp ?? '',
    captureKind: draft.captureKind ?? null,
    captureKindOther: draft.captureKindOther ?? '',
    youtubeUrl: draft.youtubeUrl ?? '',
    priceCents: draft.priceCents ?? 0,
    free: draft.free ?? false,
  }
}

function text(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/**
 * O que vai para a action. Tira itens em branco de "O que vem no pack" (o
 * schema exige item não vazio) e descarta o texto de "Outro" e os detalhes
 * de captura quando a opção correspondente está desligada.
 */
export function toDraftInput(draft: WizardDraft): ProductDraftInput {
  const hasCapture = draft.kinds.includes('CAPTURE')
  const captureKind = hasCapture ? (draft.captureKind ?? undefined) : undefined
  return {
    kinds: draft.kinds,
    kindOther: draft.kinds.includes('OTHER') ? text(draft.kindOther) : undefined,
    title: draft.title.trim(),
    shortDescription: draft.shortDescription.trim(),
    about: draft.about.trim(),
    includes: draft.includes.map((item) => item.trim()).filter(Boolean),
    styles: draft.styles,
    styleOther: draft.styleOtherOn ? text(draft.styleOther) : undefined,
    capturedAmp: hasCapture ? text(draft.capturedAmp) : undefined,
    captureKind,
    captureKindOther:
      captureKind === 'OTHER' ? text(draft.captureKindOther) : undefined,
    youtubeUrl: draft.youtubeUrl.trim(),
    priceCents: draft.priceCents,
    free: draft.free,
  }
}

/** Itens novos sugeridos pelo vendedor (vão para a revisão da equipe). */
export function suggestionsOf(input: ProductDraftInput): string[] {
  return [input.kindOther, input.styleOther, input.captureKindOther].filter(
    (value): value is string => Boolean(value),
  )
}

/** Centavos -> texto do campo ("67,92"); 0 vira vazio. Sem Float. */
export function centsToInput(cents: number): string {
  if (cents <= 0) return ''
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`
}

/**
 * Quebra de uma venda no formulário. Ainda não há pedido, então a comissão é
 * a cheia (15%) e a taxa é a estimada; `founder` mostra a venda isenta.
 */
export function formPriceBreakdown(priceCents: number) {
  const commissionCents = Math.round((priceCents * SELLER_RULES.commissionBps) / 10_000)
  return {
    ...saleBreakdown({ priceCents, platformFeeCents: commissionCents }),
    founderNetCents: saleBreakdown({ priceCents, platformFeeCents: 0 }).netCents,
  }
}
