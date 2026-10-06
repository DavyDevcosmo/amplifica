// Regras do código de 6 dígitos (verificação de e-mail e redefinição de
// senha). Fica fora do auth.ts (server-only) pra o client mostrar o mesmo
// prazo e o mesmo limite que o servidor aplica — um número só, sem duplicar.
export const OTP_EXPIRES_IN_SECONDS = 5 * 60
export const OTP_MAX_ATTEMPTS = 3
