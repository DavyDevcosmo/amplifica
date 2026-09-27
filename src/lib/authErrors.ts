import { isAPIError } from 'better-auth/api'

// Traduz os códigos de erro do Better Auth (e os nossos próprios, como
// REGISTRATION_EXPIRED) pra uma mensagem em pt-BR que a UI mostra direto.
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  EMAIL_NOT_VERIFIED: 'Confirme seu e-mail antes de entrar.',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Aguarde antes de tentar de novo.',
  INVALID_OTP: 'Código inválido.',
  OTP_EXPIRED: 'Código expirado. Peça um novo.',
  INVALID_TOKEN: 'Link inválido ou expirado.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde antes de tentar de novo.',
  REGISTRATION_EXPIRED: 'Cadastro expirou. Cadastre-se novamente.',
  USER_NOT_FOUND: 'E-mail ou senha incorretos.',
  PASSWORD_TOO_SHORT: 'Senha muito curta.',
  PASSWORD_TOO_LONG: 'Senha muito longa.',
}

const DEFAULT_MESSAGE = 'Não foi possível completar a ação. Tente novamente.'

export function mapAuthError(code: string | undefined | null): string {
  if (!code) return DEFAULT_MESSAGE
  return MESSAGES[code] ?? DEFAULT_MESSAGE
}

/**
 * Extrai a mensagem certa de um erro vindo de `auth.api.*`: usa a tradução
 * pt-BR quando reconhece o `code`, e cai pra mensagem original quando o erro
 * já vem com uma mensagem pronta e sem código nosso (ex.: o "tente em X min"
 * do loginThrottleService).
 */
export function authErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    const code = error.body?.code
    if (code && MESSAGES[code]) return MESSAGES[code]
    if (error.message) return error.message
  }
  return DEFAULT_MESSAGE
}
