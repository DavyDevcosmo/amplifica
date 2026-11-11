'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { type ActionResult, fail, ok } from '@/lib/actionResult'
import { getSession } from '@/lib/auth'
import { invalidInputFailure, sessionExpiredFailure } from '@/lib/authErrors'
import {
  type BecomeSellerInput,
  becomeSellerSchema,
  type SellerProfileInput,
  sellerProfileSchema,
} from '@/schemas/sellerSchema'
import { getCurrentSeller } from '@/server/queries/sellerQueries'
import { becomeSeller, updateSellerProfile } from '@/server/services/sellerService'

export async function becomeSellerAction(
  input: BecomeSellerInput,
): Promise<ActionResult<null>> {
  const parsed = becomeSellerSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const session = await getSession()
  if (!session) return sessionExpiredFailure()

  try {
    await becomeSeller(session.user.id, parsed.data)
  } catch (error) {
    console.error('[seller]', error)
    const t = await getTranslations('errors')
    return fail(t('actionFailed'))
  }

  // fora do try/catch: redirect() lança um erro de controle do Next
  redirect('/seller')
}

export async function updateSellerProfileAction(
  input: SellerProfileInput,
): Promise<ActionResult<null>> {
  const parsed = sellerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const context = await getCurrentSeller()
  if (!context) return sessionExpiredFailure()
  const t = await getTranslations('errors')
  if (context.seller.status === 'SUSPENDED') return fail(t('actionFailed'))

  try {
    await updateSellerProfile(context.seller.id, parsed.data)
  } catch (error) {
    console.error('[seller]', error)
    return fail(t('actionFailed'))
  }

  // o nome aparece na barra lateral (layout) e a prévia/vitrine usam o perfil
  revalidatePath('/seller', 'layout')
  return ok(null)
}
