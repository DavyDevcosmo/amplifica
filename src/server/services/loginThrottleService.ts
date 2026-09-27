import 'server-only'
import { APIError } from 'better-auth/api'
import { prisma } from '@/lib/prisma'

// Bloqueio progressivo por e-mail normalizado — vale para qualquer e-mail,
// exista conta ou não, pra não revelar pra quem tenta adivinhar senha se o
// e-mail está cadastrado.
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/**
 * Escala de bloqueio: 5 falhas → 1 min, 8 → 5 min, 10 → 15 min, e a partir
 * daí dobra a cada falha extra até o teto de 1h.
 */
export function computeLockout(failedCount: number): number {
  if (failedCount < 5) return 0
  if (failedCount < 8) return 1 * MINUTE
  if (failedCount < 10) return 5 * MINUTE
  const extraFailures = failedCount - 10
  const ms = 15 * MINUTE * 2 ** extraFailures
  return Math.min(ms, HOUR)
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function assertNotLocked(email: string) {
  const throttle = await prisma.loginThrottle.findUnique({
    where: { email: normalizeEmail(email) },
  })
  if (!throttle?.lockedUntil || throttle.lockedUntil <= new Date()) return

  const minutesLeft = Math.ceil((throttle.lockedUntil.getTime() - Date.now()) / MINUTE)
  throw new APIError('TOO_MANY_REQUESTS', {
    message: `Muitas tentativas. Tente novamente em ${minutesLeft} min.`,
  })
}

export async function registerFailure(email: string) {
  const key = normalizeEmail(email)

  // INSERT ... ON CONFLICT com incremento direto no banco: duas tentativas
  // erradas em paralelo (o cenário que esse serviço existe pra travar) não
  // podem ler o mesmo failedCount e as duas escreverem "+1", perdendo uma
  // falha e atrasando o bloqueio — por isso não é um findUnique + upsert.
  const [row] = await prisma.$queryRaw<[{ failedCount: number }]>`
    INSERT INTO "login_throttles" ("email", "failedCount", "lastFailedAt")
    VALUES (${key}, 1, now())
    ON CONFLICT ("email") DO UPDATE SET
      "failedCount" = CASE
        WHEN "login_throttles"."lastFailedAt" < now() - interval '24 hours' THEN 1
        ELSE "login_throttles"."failedCount" + 1
      END,
      "lastFailedAt" = now()
    RETURNING "failedCount"
  `
  const lockoutMs = computeLockout(row.failedCount)
  const lockedUntil = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : null

  await prisma.loginThrottle.update({ where: { email: key }, data: { lockedUntil } })
}

export async function registerSuccess(email: string) {
  const key = normalizeEmail(email)
  await prisma.loginThrottle.deleteMany({ where: { email: key } })
}
