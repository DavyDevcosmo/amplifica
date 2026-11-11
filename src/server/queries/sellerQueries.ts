import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { SellerProfileModel } from '@/generated/prisma/models'
import { getSession, requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletSummary } from '@/server/services/walletService'
import type { SessionUser } from '@/types/auth'
import { getSellerItems } from './salesQueries'

export type SellerContext = { user: SessionUser; seller: SellerProfileModel }

// cache(): o layout e as páginas do vendedor pedem o contexto na mesma
// requisição, e só a primeira chamada vai ao banco.
export const getCurrentSeller = cache(
  async function getCurrentSeller(): Promise<SellerContext | null> {
    const session = await getSession()
    if (!session) return null
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    })
    return seller ? { user: session.user, seller } : null
  },
)

/**
 * Guard da área do vendedor: sem sessão vai para o login, sem perfil vai
 * para o onboarding e vendedor suspenso volta para a loja.
 */
export async function requireSeller(): Promise<SellerContext> {
  const context = await getCurrentSeller()
  if (!context) {
    await requireUser('/seller') // sem sessão: redireciona para /login
    redirect('/becomeSeller')
  }
  if (context.seller.status === 'SUSPENDED') redirect('/')
  return context
}

// Resumo da barra lateral: quanto ainda está retido (venda paga, dentro dos
// 30 dias), pela mesma conta da carteira.
export async function getSellerNavSummary(
  sellerId: string,
): Promise<{ heldCents: number }> {
  const items = await getSellerItems(sellerId)
  return { heldCents: walletSummary(items, new Date()).heldCents }
}

// Quantos produtos o vendedor tem (qualquer status) e quantos estão no ar.
// O painel usa para decidir entre o checklist de início e os números.
export async function countSellerProducts(
  sellerId: string,
): Promise<{ total: number; published: number }> {
  const [total, published] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.product.count({ where: { sellerId, status: 'PUBLISHED' } }),
  ])
  return { total, published }
}
