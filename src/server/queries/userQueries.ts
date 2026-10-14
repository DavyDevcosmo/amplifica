import 'server-only'
import { prisma } from '@/lib/prisma'

/**
 * Como o usuário entra na conta: `hasPassword` é a conta "credential" do
 * Better Auth (senha própria) e `hasGoogle` o login social vinculado. Quem só
 * entrou pelo Google não tem senha — a tela de segurança pede "definir" em vez
 * de "trocar".
 */
export async function getLoginMethods(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, providerId: { in: ['credential', 'google'] } },
    select: { providerId: true },
  })
  const providers = new Set(accounts.map((account) => account.providerId))
  return {
    hasPassword: providers.has('credential'),
    hasGoogle: providers.has('google'),
  }
}
