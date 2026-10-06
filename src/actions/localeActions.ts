'use server'

import { cookies } from 'next/headers'
import { isLocale, LOCALE_COOKIE } from '@/i18n/config'
import { type ActionResult, fail, ok } from '@/lib/actionResult'

// Só grava o cookie de idioma. Quem chama faz router.refresh() depois, pra
// os Server Components renderizarem de novo no idioma novo.
export async function setLocaleAction(locale: string): Promise<ActionResult<null>> {
  if (!isLocale(locale)) return fail('invalidData')
  ;(await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return ok(null)
}
