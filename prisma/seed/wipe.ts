import { prisma } from '@/lib/prisma'

/**
 * Apaga todas as tabelas de domínio para recomeçar o seed do zero.
 *
 * Duas travas, porque checar só NODE_ENV/VERCEL_ENV não pega o caso comum:
 * rodar `pnpm db:seed` na sua própria máquina, onde nenhuma das duas vale
 * "production", mesmo que o DATABASE_URL do .env aponte para o banco errado.
 * Por isso o wipe exige opt-in explícito (SEED_ALLOW_WIPE=true no .env local,
 * nunca em CI/produção) além de bloquear NODE_ENV/VERCEL_ENV=production.
 */
export async function wipe() {
  const isProductionEnv =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  const wipeAllowed = process.env.SEED_ALLOW_WIPE === 'true'

  if (isProductionEnv || !wipeAllowed) {
    throw new Error(
      'Seed destrutivo bloqueado. Defina SEED_ALLOW_WIPE=true no .env local (nunca em CI/produção) para confirmar que o DATABASE_URL aponta para um banco de dev descartável.',
    )
  }

  // Ordem reversa de FK: filhos antes dos pais. Numa única transação: se um
  // deleteMany falhar no meio, nenhum é aplicado — evita banco parcialmente
  // apagado.
  await prisma.$transaction([
    prisma.download.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.entitlement.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productFile.deleteMany(),
    prisma.bundleItem.deleteMany(),
    prisma.productRevision.deleteMany(),
    prisma.product.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.category.deleteMany(),
    prisma.sellerProfile.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.user.deleteMany(),
    prisma.stripeEvent.deleteMany(),
  ])
}
