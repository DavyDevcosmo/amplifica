'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { type ActionResult, fail, ok } from '@/lib/actionResult'
import { invalidInputFailure, sessionExpiredFailure } from '@/lib/authErrors'
import {
  type ConfirmProductUploadInput,
  confirmProductUploadSchema,
  type ProductDraftInput,
  type ProductUploadInput,
  productDraftSchema,
  productUploadSchema,
} from '@/schemas/productSchema'
import { getCurrentSeller } from '@/server/queries/sellerQueries'
import {
  confirmProductUpload,
  removeProductFile,
  requestProductUpload,
  UploadRejectedError,
  type UploadRejection,
  UploadsUnavailableError,
} from '@/server/services/productFileService'
import {
  createProductDraft,
  ProductIncompleteError,
  ProductLockedError,
  ProductNotFoundError,
  saveProductDraft,
  submitProductForReview,
} from '@/server/services/productService'

const productIdSchema = z.string().trim().min(1).max(64)

const PRODUCTS_PATH = '/seller/products'

type SellerGate = { sellerId: string } | { failure: ActionResult<never> }

// Vendedor da sessão. Sem sessão/perfil: sessão expirada; suspenso: falha.
async function currentSellerId(): Promise<SellerGate> {
  const context = await getCurrentSeller()
  if (!context) return { failure: await sessionExpiredFailure() }
  if (context.seller.status === 'SUSPENDED') {
    const t = await getTranslations('errors')
    return { failure: fail(t('actionFailed')) }
  }
  return { sellerId: context.seller.id }
}

const UPLOAD_REJECTION_MESSAGES = {
  typeNotAllowed: 'seller.fileTypeNotAllowed',
  tooLarge: 'seller.fileTooLarge',
  empty: 'seller.fileEmpty',
  tooMany: 'seller.tooManyFiles',
  invalidKey: 'seller.uploadInvalid',
  missing: 'seller.uploadMissing',
} as const satisfies Record<UploadRejection, string>

async function productFailure(error: unknown): Promise<ActionResult<never>> {
  const t = await getTranslations('errors')
  if (error instanceof UploadsUnavailableError) {
    return fail(t('seller.uploadsUnavailable'), { code: 'UPLOADS_UNAVAILABLE' })
  }
  if (error instanceof UploadRejectedError) {
    return fail(t(UPLOAD_REJECTION_MESSAGES[error.reason]), {
      code: 'UPLOAD_REJECTED',
      params: { reason: error.reason },
    })
  }
  if (error instanceof ProductNotFoundError) {
    return fail(t('seller.productNotFound'), { code: 'PRODUCT_NOT_FOUND' })
  }
  if (error instanceof ProductLockedError) {
    return fail(t('seller.productLocked'), { code: 'PRODUCT_LOCKED' })
  }
  if (error instanceof ProductIncompleteError) {
    return fail(t('seller.productIncomplete'), {
      code: 'PRODUCT_INCOMPLETE',
      params: { missing: error.missing.join(',') },
    })
  }
  console.error('[product]', error)
  return fail(t('actionFailed'))
}

async function notFoundFailure(): Promise<ActionResult<never>> {
  return productFailure(new ProductNotFoundError())
}

export async function createProductDraftAction(
  input: ProductDraftInput,
): Promise<ActionResult<{ productId: string }>> {
  const parsed = productDraftSchema.safeParse(input)
  if (!parsed.success) return invalidInputFailure(parsed.error.issues[0]?.message)

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    const created = await createProductDraft(gate.sellerId, parsed.data)
    revalidatePath(PRODUCTS_PATH)
    return ok(created)
  } catch (error) {
    return productFailure(error)
  }
}

export async function saveProductDraftAction(
  productId: string,
  input: ProductDraftInput,
): Promise<ActionResult<null>> {
  const id = productIdSchema.safeParse(productId)
  if (!id.success) return notFoundFailure()
  const parsed = productDraftSchema.safeParse(input)
  if (!parsed.success) return invalidInputFailure(parsed.error.issues[0]?.message)

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    await saveProductDraft(gate.sellerId, id.data, parsed.data)
    revalidatePath(PRODUCTS_PATH)
    return ok(null)
  } catch (error) {
    return productFailure(error)
  }
}

export async function submitProductAction(
  productId: string,
): Promise<ActionResult<null>> {
  const id = productIdSchema.safeParse(productId)
  if (!id.success) return notFoundFailure()

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    await submitProductForReview(gate.sellerId, id.data)
    revalidatePath(PRODUCTS_PATH)
    return ok(null)
  } catch (error) {
    return productFailure(error)
  }
}

// ---------------------------------------------------------------------------
// Arquivos do produto: pedir URL assinada -> PUT direto no R2 -> confirmar
// ---------------------------------------------------------------------------

export async function requestProductUploadAction(
  input: ProductUploadInput,
): Promise<ActionResult<{ url: string; key: string }>> {
  const parsed = productUploadSchema.safeParse(input)
  if (!parsed.success) return invalidInputFailure(parsed.error.issues[0]?.message)

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    return ok(await requestProductUpload(gate.sellerId, parsed.data))
  } catch (error) {
    return productFailure(error)
  }
}

export async function confirmProductUploadAction(
  input: ConfirmProductUploadInput,
): Promise<ActionResult<{ fileId: string }>> {
  const parsed = confirmProductUploadSchema.safeParse(input)
  if (!parsed.success) return invalidInputFailure(parsed.error.issues[0]?.message)

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    const confirmed = await confirmProductUpload(gate.sellerId, parsed.data)
    revalidatePath(PRODUCTS_PATH)
    return ok(confirmed)
  } catch (error) {
    return productFailure(error)
  }
}

export async function removeProductFileAction(
  fileId: string,
): Promise<ActionResult<null>> {
  const id = productIdSchema.safeParse(fileId)
  if (!id.success) return notFoundFailure()

  const gate = await currentSellerId()
  if ('failure' in gate) return gate.failure

  try {
    await removeProductFile(gate.sellerId, id.data)
    revalidatePath(PRODUCTS_PATH)
    return ok(null)
  } catch (error) {
    return productFailure(error)
  }
}
