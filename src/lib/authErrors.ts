import { isAPIError } from 'better-auth/api'
import { getTranslations } from 'next-intl/server'
import { type ActionResult, fail } from '@/lib/actionResult'

// Código de erro do Better Auth (ou nosso, como REGISTRATION_EXPIRED) -> chave
// do namespace `errors` em src/messages/<locale>/errors.json.
const MESSAGE_KEYS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'invalidCredentials',
  USER_NOT_FOUND: 'invalidCredentials',
  EMAIL_NOT_VERIFIED: 'emailNotVerified',
  TOO_MANY_ATTEMPTS: 'tooManyAttempts',
  TOO_MANY_REQUESTS: 'tooManyAttempts',
  INVALID_OTP: 'invalidOtp',
  OTP_EXPIRED: 'otpExpired',
  REGISTRATION_EXPIRED: 'registrationExpired',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
  PASSWORD_TOO_LONG: 'passwordTooLong',
}

/**
 * Falha de action traduzida a partir de um erro de `auth.api.*`. Nunca expõe
 * `error.message` cru: só códigos mapeados acima (ou LOGIN_LOCKED, cujo tempo
 * restante vem em `body.minutes`) viram texto; qualquer outro cai em
 * `actionFailed`. O `code` vai junto pra UI decidir o estado visual.
 */
export async function authFailure(error: unknown): Promise<ActionResult<never>> {
  const t = await getTranslations('errors')
  if (isAPIError(error)) {
    const code = error.body?.code as string | undefined
    if (code === 'LOGIN_LOCKED') {
      const minutes = Number((error.body as { minutes?: unknown })?.minutes) || 1
      return fail(t('loginLocked', { minutes }), { code, params: { minutes } })
    }
    if (code && MESSAGE_KEYS[code]) return fail(t(MESSAGE_KEYS[code]), { code })
  }
  return fail(t('actionFailed'))
}

/** Falha de validação: `issueMessage` é uma chave de `errors` (mensagem do schema Zod). */
export async function invalidInputFailure(
  issueMessage?: string,
): Promise<ActionResult<never>> {
  const t = await getTranslations('errors')
  return fail(issueMessage && t.has(issueMessage) ? t(issueMessage) : t('invalidData'))
}

export async function sessionExpiredFailure(): Promise<ActionResult<never>> {
  const t = await getTranslations('errors')
  return fail(t('sessionExpired'), { code: 'SESSION_EXPIRED' })
}
