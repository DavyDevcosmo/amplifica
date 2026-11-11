'use client'

import { ChevronLeftIcon, LockIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  createProductDraftAction,
  saveProductDraftAction,
  submitProductAction,
} from '@/actions/productActions'
import { ProductStatusBadge } from '@/components/seller/ProductStatusBadge'
import type { ActionResult } from '@/lib/actionResult'
import { cn } from '@/lib/utils'
import {
  type ChecklistItem,
  isEditable,
  submitChecklist,
} from '@/schemas/productSchema'
import type { ProductEditData } from '@/server/queries/productQueries'
import { FOCUS } from './formStyles'
import { StepClassification } from './StepClassification'
import { StepFiles } from './StepFiles'
import { StepInfo } from './StepInfo'
import { StepPrice } from './StepPrice'
import { StepReview } from './StepReview'
import { StorePreviewCard } from './StorePreviewCard'
import { SubmitChecklist } from './SubmitChecklist'
import { WizardNavBar } from './WizardNavBar'
import { type StepperItem, WizardStepper } from './WizardStepper'
import {
  stepComplete,
  toDraftInput,
  toWizardDraft,
  WIZARD_STEPS,
  type WizardDraft,
  type WizardStep,
} from './wizardSteps'

const CHECKLIST_IDS = new Set<string>(['basics', 'files', 'price'])

type Saved = { productId: string; created: boolean }

/**
 * Formulário do produto em 5 etapas. O rascunho fica em estado local;
 * avançar, salvar ou pular de etapa salva (cria o produto na primeira vez e
 * troca a URL para /edit). "Voltar" não salva. Em análise, tudo só leitura.
 */
export function ProductWizard({
  initial,
  step,
  uploadsEnabled = true,
}: {
  initial: ProductEditData | null
  step: WizardStep
  uploadsEnabled?: boolean
}) {
  const t = useTranslations('seller.productForm')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [draft, setDraft] = useState<WizardDraft>(() => toWizardDraft(initial?.draft))
  const [isPending, startTransition] = useTransition()

  const productId = initial?.productId ?? null
  const readOnly = initial ? !isEditable(initial.status) : false
  // sem produto salvo só existe a etapa 1 (avançar salva e cria o produto)
  const current: WizardStep = productId ? step : 1
  const files = initial?.files ?? []
  const deliverableCount = files.filter((file) => file.kind === 'DELIVERABLE').length
  const hasPreview = files.some((file) => file.kind === 'PREVIEW_AUDIO')
  const coverUrl = files.find((file) => file.kind === 'COVER_IMAGE')?.url ?? null

  const input = useMemo(() => toDraftInput(draft), [draft])
  const checklist = submitChecklist(input, deliverableCount)

  const missingText = (ids: ChecklistItem['id'][]) =>
    ids.length > 0
      ? t('nav.blocked', { items: ids.map((id) => t(`missing.${id}`)).join(', ') })
      : null
  const blockedText = missingText(
    checklist.filter((item) => !item.ok).map((item) => item.id),
  )

  const stepperItems: StepperItem[] = WIZARD_STEPS.map(({ n, key }) => ({
    n,
    label: t(`steps.${key}`),
    state:
      n === current
        ? 'current'
        : n > current
          ? 'future'
          : stepComplete(n, input, deliverableCount)
            ? 'done'
            : 'missing',
  }))

  function patch(value: Partial<WizardDraft>) {
    setDraft((previous) => ({ ...previous, ...value }))
  }

  function showError(result: Extract<ActionResult<unknown>, { success: false }>) {
    const missing =
      result.code === 'PRODUCT_INCOMPLETE' && typeof result.params?.missing === 'string'
        ? (result.params.missing
            .split(',')
            .filter((id) => CHECKLIST_IDS.has(id)) as ChecklistItem['id'][])
        : []
    const description = missingText(missing)
    toast.error(result.error, description ? { description } : undefined)
  }

  // Id criado nesta página (/new). Enquanto o servidor renderiza /edit a
  // página continua interativa com `productId === null`: salvar de novo usa
  // este id em vez de criar outro rascunho.
  const createdIdRef = useRef<string | null>(null)
  // Trava síncrona contra duplo clique (antes de `isPending` re-renderizar).
  const inFlightRef = useRef(false)
  // Enviado para análise: nada mais salva/envia até sair da página.
  const [leaving, setLeaving] = useState(false)
  const busy = isPending || leaving

  async function save(): Promise<Saved | null> {
    const id = productId ?? createdIdRef.current
    if (!id) {
      const result = await createProductDraftAction(input)
      if (!result.success) {
        showError(result)
        return null
      }
      createdIdRef.current = result.data.productId
      return { productId: result.data.productId, created: true }
    }
    const result = await saveProductDraftAction(id, input)
    if (!result.success) {
      showError(result)
      return null
    }
    return { productId: id, created: false }
  }

  // A navegação vai numa transição própria: `isPending` cobre o tempo até a
  // próxima página chegar (updates depois de um await saem da transição).
  function navigate(target: WizardStep) {
    const createdId = productId ? null : createdIdRef.current
    startTransition(() => {
      if (createdId) {
        router.replace(`/seller/products/${createdId}/edit?etapa=${target}`)
      } else {
        router.push(`?etapa=${target}`)
      }
    })
  }

  function run(task: () => Promise<void>) {
    if (inFlightRef.current || busy) return
    inFlightRef.current = true
    startTransition(async () => {
      try {
        await task()
      } catch {
        toast.error(tErrors('actionFailed'))
      } finally {
        inFlightRef.current = false
      }
    })
  }

  function goTo(target: WizardStep) {
    if (target === current || busy) return
    if (readOnly) {
      navigate(target)
      return
    }
    run(async () => {
      if (await save()) navigate(target)
    })
  }

  function back() {
    if (current > 1 && !busy) navigate((current - 1) as WizardStep)
  }

  function next() {
    if (current < WIZARD_STEPS.length) goTo((current + 1) as WizardStep)
  }

  function saveDraft() {
    if (readOnly) return
    run(async () => {
      const saved = await save()
      if (!saved) return
      toast.success(t('toast.saved'))
      if (saved.created) navigate(current)
    })
  }

  function submit() {
    if (readOnly) return
    run(async () => {
      const saved = await save()
      if (!saved) return
      const result = await submitProductAction(saved.productId)
      if (!result.success) {
        showError(result)
        return
      }
      setLeaving(true)
      toast.success(t('toast.submitted'))
      startTransition(() => router.push('/seller/products?situacao=review'))
    })
  }

  return (
    <div className="flex flex-col gap-4.5 md:gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/seller/products"
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 self-start rounded-full text-[0.8125rem] font-semibold text-ardosia hover:text-foreground',
            FOCUS,
          )}
        >
          <ChevronLeftIcon aria-hidden className="size-4" />
          {t('back')}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[clamp(1.625rem,2.6vw,2.125rem)] leading-[1.05] text-marinho dark:text-foreground">
            {initial ? t('titleEdit') : t('titleNew')}
          </h1>
          {initial ? <ProductStatusBadge status={initial.status} /> : null}
        </div>
        <p className="text-[0.9375rem] leading-[1.375rem] text-ardosia">
          {t('subtitle')}
        </p>
      </header>

      {readOnly ? (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-tile bg-azul/10 px-4 py-3 text-sm font-semibold text-azul-forte dark:bg-azul/20 dark:text-azul-claro"
        >
          <LockIcon aria-hidden className="size-4 flex-none" />
          {t('locked')}
        </p>
      ) : null}

      <WizardStepper
        steps={stepperItems}
        current={current}
        onGo={goTo}
        disabled={busy}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <fieldset
            disabled={readOnly}
            className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
          >
            {current === 1 ? <StepInfo draft={draft} onChange={patch} /> : null}
            {current === 2 ? (
              <StepClassification draft={draft} onChange={patch} />
            ) : null}
            {current === 3 && productId ? (
              <StepFiles
                productId={productId}
                files={files}
                youtubeUrl={draft.youtubeUrl}
                onChange={patch}
                readOnly={readOnly}
                uploadsEnabled={uploadsEnabled}
              />
            ) : null}
            {current === 4 ? (
              <StepPrice
                priceCents={draft.priceCents}
                free={draft.free}
                founderRemainingSales={initial?.founderRemainingSales ?? 0}
                onChange={patch}
                disabled={readOnly}
              />
            ) : null}
            {current === 5 ? (
              <StepReview
                draft={input}
                deliverableCount={deliverableCount}
                hasPreview={hasPreview}
                readOnly={readOnly}
                onEdit={goTo}
              />
            ) : null}
          </fieldset>

          <WizardNavBar
            step={current}
            readOnly={readOnly}
            pending={busy}
            canSubmit={blockedText === null}
            blockedText={blockedText}
            onBack={back}
            onSaveDraft={saveDraft}
            onNext={next}
            onSubmit={submit}
          />
        </div>

        <aside
          aria-label={t('preview.region')}
          className="hidden self-start lg:sticky lg:top-6 lg:block"
        >
          <div className="flex flex-col gap-5">
            <StorePreviewCard draft={input} coverUrl={coverUrl} />
            <SubmitChecklist items={checklist} free={input.free ?? false} />
          </div>
        </aside>
      </div>
    </div>
  )
}
