import 'server-only'
import { randomUUID } from 'node:crypto'
import type { SellerProfileModel } from '@/generated/prisma/models'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { BecomeSellerInput, SellerProfileData } from '@/schemas/sellerSchema'

const MAX_SLUG_ATTEMPTS = 3

function buildSlug(displayName: string) {
  // slugify devolve '' para nomes sem letras latinas (ex.: só emojis ou kanji)
  const base = slugify(displayName) || 'vendedor'
  const suffix = randomUUID().replaceAll('-', '').slice(0, 6)
  return `${base}-${suffix}`
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

/**
 * Cria o perfil de vendedor do usuário. Se ele já tem perfil, devolve o
 * existente (idempotente: duplo clique ou duas abas não geram erro).
 *
 * `isFounder` nasce `false`: a regra do Programa Fundador ainda não foi
 * definida. A foto do vendedor é a do usuário (`avatarKey` fica nulo).
 */
export async function becomeSeller(
  userId: string,
  input: BecomeSellerInput,
): Promise<SellerProfileModel> {
  const existing = await prisma.sellerProfile.findUnique({ where: { userId } })
  if (existing) return existing

  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.sellerProfile.create({
        data: {
          userId,
          displayName: input.displayName,
          bio: input.bio || null,
          slug: buildSlug(input.displayName),
          avatarKey: null,
          isFounder: false,
        },
      })
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      // outra requisição criou o perfil do mesmo usuário no meio do caminho
      const created = await prisma.sellerProfile.findUnique({ where: { userId } })
      if (created) return created
      // senão foi colisão do slug aleatório: tenta de novo com outro sufixo
      if (attempt >= MAX_SLUG_ATTEMPTS) throw error
    }
  }
}

/**
 * Atualiza o perfil público do vendedor. Campo opcional em branco vira nulo.
 * O slug não muda (a vitrine mantém o mesmo endereço) e a foto é a do usuário.
 */
export async function updateSellerProfile(
  sellerId: string,
  input: SellerProfileData,
): Promise<void> {
  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      displayName: input.displayName,
      bio: input.bio || null,
      city: input.city || null,
      devices: input.devices,
      instagram: input.instagram || null,
      youtube: input.youtube || null,
      tiktok: input.tiktok || null,
      spotifyUrl: input.spotifyUrl || null,
    },
  })
}
