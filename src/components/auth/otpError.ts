// Estado visual do campo de código a partir do `code` que a action devolve
// (nunca pelo texto, que já vem traduzido).
//   invalid   -> dígito errado: editar o código limpa o aviso
//   expired   -> só um código novo resolve
//   exhausted -> limite de tentativas: só um código novo resolve
//   other     -> qualquer outro erro: mostra o texto da action
export type OtpErrorKind = 'invalid' | 'expired' | 'exhausted' | 'other'

export type OtpError = { kind: OtpErrorKind; text: string }

export function otpErrorKind(code?: string): OtpErrorKind {
  if (code === 'INVALID_OTP') return 'invalid'
  if (code === 'OTP_EXPIRED') return 'expired'
  if (code === 'TOO_MANY_ATTEMPTS') return 'exhausted'
  return 'other'
}

// Erros que o cooldown de reenvio não deve segurar.
export function needsNewCode(kind?: OtpErrorKind): boolean {
  return kind === 'expired' || kind === 'exhausted'
}
