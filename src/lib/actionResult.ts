// Formato de retorno padrão de toda Server Action — ver CLAUDE.md.
//
// `error` já vem traduzido no idioma atual (cookie NEXT_LOCALE). `code` e
// `params` são opcionais e servem pra UI decidir o ESTADO visual sem
// comparar texto (ex.: 'OTP_EXPIRED', ou 'LOGIN_LOCKED' com { minutes }).
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: string
      code?: string
      params?: Record<string, string | number>
    }

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function fail<T = never>(
  error: string,
  extra?: { code?: string; params?: Record<string, string | number> },
): ActionResult<T> {
  return { success: false, error, ...extra }
}
