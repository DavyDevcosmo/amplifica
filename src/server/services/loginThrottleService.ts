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
  // `code: 'LOGIN_LOCKED'` é o que permite authErrorMessage() repassar essa
  // mensagem dinâmica pro client — sem `code`, ela cairia no mesmo balde de
  // "qualquer erro sem código mapeado" e um erro futuro sem relação nenhuma
  // com bloqueio de login poderia vazar mensagem interna por engano.
  throw new APIError('TOO_MANY_REQUESTS', {
    code: 'LOGIN_LOCKED',
    message: `Muitas tentativas. Tente novamente em ${minutesLeft} min.`,
    minutes: minutesLeft,
  })
}

export async function registerFailure(email: string) {
  const key = normalizeEmail(email)

  // Tudo dentro de uma transação com SELECT ... FOR UPDATE: a linha é
  // travada até o fim da transação, então duas falhas quase simultâneas do
  // mesmo e-mail nunca leem o mesmo failedCount nem gravam um "lockedUntil"
  // calculado a partir de um valor desatualizado — a segunda espera a
  // primeira terminar antes de ler. Isso substitui o INSERT...ON CONFLICT
  // atômico de antes, que incrementava failedCount sem race mas ainda
  // calculava e gravava lockedUntil num segundo round-trip separado.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "login_throttles" ("email", "failedCount", "lastFailedAt")
      VALUES (${key}, 0, now())
      ON CONFLICT ("email") DO NOTHING
    `
    const [row] = await tx.$queryRaw<[{ failedCount: number; lastFailedAt: Date }]>`
      SELECT "failedCount", "lastFailedAt" FROM "login_throttles"
      WHERE "email" = ${key}
      FOR UPDATE
    `
    const failedCount =
      row.lastFailedAt.getTime() < Date.now() - 24 * HOUR ? 1 : row.failedCount + 1
    const lockoutMs = computeLockout(failedCount)
    const lockedUntil = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : null

    await tx.$executeRaw`
      UPDATE "login_throttles"
      SET "failedCount" = ${failedCount}, "lastFailedAt" = now(), "lockedUntil" = ${lockedUntil}
      WHERE "email" = ${key}
    `
  })
}

export async function registerSuccess(email: string) {
  const key = normalizeEmail(email)
  await prisma.loginThrottle.deleteMany({ where: { email: key } })
}

/**
 * Apaga registros de throttle antigos e já destravados — chamado pelo cron
 * diário (mesma rede de segurança do purgeExpiredUnverified). Sem isso,
 * `login_throttles` cresce pra sempre: toda tentativa de login errada grava
 * uma linha, mesmo pra e-mail que não existe (é assim que se evita revelar
 * quais e-mails têm conta).
 */
export async function purgeStaleThrottles(olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * HOUR)
  const { count } = await prisma.loginThrottle.deleteMany({
    where: {
      lastFailedAt: { lt: cutoff },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
    },
  })
  return count
}
