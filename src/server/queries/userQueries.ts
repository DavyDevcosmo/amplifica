import 'server-only'
import { prisma } from '@/lib/prisma'

/**
 * True quando o usuário tem uma senha própria (conta "credential" do Better
 * Auth). Usado pra esconder a troca de senha de quem só entrou pelo Google.
 */
export async function hasCredentialAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
    select: { id: true },
  })
  return Boolean(account)
}
