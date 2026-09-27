import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import {
  BusinessType,
  SellerStatus,
  StripeAccountStatus,
  UserRole,
  UserStatus,
} from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'
import { SEED_PASSWORD } from './helpers'

type NewUser = {
  name: string
  email: string
  role?: (typeof UserRole)[keyof typeof UserRole]
  status?: (typeof UserStatus)[keyof typeof UserStatus]
}

async function createUserWithCredential(passwordHash: string, input: NewUser) {
  const userId = randomUUID()
  // User + Account (credencial de login) numa escrita aninhada só: se falhar
  // no meio, não sobra usuário sem credencial (ou vice-versa).
  return prisma.user.create({
    data: {
      id: userId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role ?? UserRole.USER,
      status: input.status ?? UserStatus.ACTIVE,
      accounts: {
        create: {
          id: randomUUID(),
          providerId: 'credential',
          accountId: userId,
          password: passwordHash,
        },
      },
    },
  })
}

/** Cria o admin, 3 compradores e 4 vendedores (com seus SellerProfile). */
export async function seedUsersAndSellers() {
  const passwordHash = await hashPassword(SEED_PASSWORD)

  const admin = await createUserWithCredential(passwordHash, {
    name: 'Admin Amplifica',
    email: 'admin@amplifica.dev',
    role: UserRole.ADMIN,
  })

  const [buyer1, buyer2, buyer3] = await Promise.all([
    createUserWithCredential(passwordHash, {
      name: 'Carla Comprador',
      email: 'carla@amplifica.dev',
    }),
    createUserWithCredential(passwordHash, {
      name: 'Diego Comprador',
      email: 'diego@amplifica.dev',
    }),
    createUserWithCredential(passwordHash, {
      name: 'Ana Comprador',
      email: 'ana@amplifica.dev',
    }),
  ])

  const seller1User = await createUserWithCredential(passwordHash, {
    name: 'Rafael Founder',
    email: 'rafael@amplifica.dev',
  })
  const seller2User = await createUserWithCredential(passwordHash, {
    name: 'Estúdio Timbre LTDA',
    email: 'contato@estudiotimbre.dev',
  })
  const seller3User = await createUserWithCredential(passwordHash, {
    name: 'Bruno Vendedor',
    email: 'bruno@amplifica.dev',
  })
  const seller4User = await createUserWithCredential(passwordHash, {
    name: 'Julia Vendedora',
    email: 'julia@amplifica.dev',
  })

  const seller1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      slug: 'rafael-founder',
      displayName: 'Rafael Founder',
      bio: 'Um dos primeiros vendedores do Amplifica — presets de metal e captures.',
      status: SellerStatus.ACTIVE,
      stripeAccountId: 'acct_founder_rafael',
      stripeAccountStatus: StripeAccountStatus.VERIFIED,
      businessType: BusinessType.INDIVIDUAL,
      isFounder: true,
      founderWaivedSalesCount: 1,
    },
  })
  const seller2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2User.id,
      slug: 'estudio-timbre',
      displayName: 'Estúdio Timbre',
      bio: 'Produção de patches e IRs para louvor e clean tones.',
      status: SellerStatus.ACTIVE,
      stripeAccountId: 'acct_founder_estudio',
      stripeAccountStatus: StripeAccountStatus.VERIFIED,
      businessType: BusinessType.COMPANY,
      isFounder: true,
      founderWaivedSalesCount: 0,
    },
  })
  const seller3 = await prisma.sellerProfile.create({
    data: {
      userId: seller3User.id,
      slug: 'bruno-vendedor',
      displayName: 'Bruno Vendedor',
      bio: 'IRs vintage e presets de blues.',
      status: SellerStatus.ACTIVE,
      stripeAccountId: 'acct_bruno',
      stripeAccountStatus: StripeAccountStatus.VERIFIED,
      businessType: BusinessType.INDIVIDUAL,
      isFounder: false,
    },
  })
  const seller4 = await prisma.sellerProfile.create({
    data: {
      userId: seller4User.id,
      slug: 'julia-vendedora',
      displayName: 'Julia Vendedora',
      bio: 'Começando a vender no Amplifica.',
      status: SellerStatus.ACTIVE,
      stripeAccountStatus: StripeAccountStatus.NOT_STARTED,
      isFounder: false,
    },
  })

  return {
    admin,
    buyer1,
    buyer2,
    buyer3,
    seller1User,
    seller2User,
    seller3User,
    seller4User,
    seller1,
    seller2,
    seller3,
    seller4,
  }
}
