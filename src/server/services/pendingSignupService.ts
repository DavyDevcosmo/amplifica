import 'server-only'
import { APIError } from 'better-auth/api'
import { prisma } from '@/lib/prisma'

// Cadastro temporário: o User existe com emailVerified=false por até 30 min.
// Passado isso, ele é descartável — não guardamos nenhuma tabela extra pra
// isso, só apagamos o User (o cascade do schema já leva Account e Session
// junto) quando ele expira.
const SIGNUP_TTL_MS = 30 * 60 * 1000

/**
 * Apaga usuários com emailVerified=false criados há mais de 30 min. Chamado
 * de forma preguiçosa (nos hooks abaixo) e também pelo cron diário — o cron
 * sozinho não garante os 30 min no plano Hobby da Vercel (só roda 1x/dia).
 */
export async function purgeExpiredUnverified(email?: string) {
  const cutoff = new Date(Date.now() - SIGNUP_TTL_MS)
  const { count } = await prisma.user.deleteMany({
    where: {
      emailVerified: false,
      createdAt: { lt: cutoff },
      ...(email ? { email: email.trim().toLowerCase() } : {}),
    },
  })
  return count
}

/**
 * Chamado antes de mandar/verificar o código de um cadastro pendente. Se o
 * cadastro já passou dos 30 min, apaga o usuário e derruba a requisição com
 * um erro específico — a UI manda o usuário de volta pro formulário de
 * cadastro em vez de ficar tentando verificar um código que nunca vai
 * validar.
 */
export async function assertSignupNotExpired(email: string) {
  const normalized = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalized } })
  if (!user || user.emailVerified) return

  const expired = user.createdAt.getTime() < Date.now() - SIGNUP_TTL_MS
  if (!expired) return

  await prisma.user.delete({ where: { id: user.id } })
  throw new APIError('BAD_REQUEST', {
    code: 'REGISTRATION_EXPIRED',
    message: 'Cadastro expirou. Cadastre-se novamente.',
  })
}
