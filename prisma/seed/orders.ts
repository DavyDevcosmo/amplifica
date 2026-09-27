import { OrderItemStatus, OrderStatus, RefundStatus } from '@/generated/prisma/enums'
import type {
  ProductModel,
  ProductRevisionModel,
  SellerProfileModel,
  UserModel,
} from '@/generated/prisma/models'
import { prisma } from '@/lib/prisma'
import {
  addDays,
  daysAgo,
  HOLD_DAYS,
  PLATFORM_COMMISSION_BPS,
  splitCommission,
} from './helpers'

type OrdersInput = {
  buyer1: UserModel
  buyer2: UserModel
  buyer3: UserModel
  seller1: SellerProfileModel
  seller3: SellerProfileModel
  seller4: SellerProfileModel
  p1: ProductModel
  p1RevisionV2: ProductRevisionModel
  p2: ProductModel
  p2RevisionV1: ProductRevisionModel
  p2RevisionV2: ProductRevisionModel
  p5: ProductModel
  p10: ProductModel
  p10Revision: ProductRevisionModel
}

/**
 * Cria 4 pedidos cobrindo os principais `OrderStatus`: pago com 2 vendedores,
 * pago com comissão de founder zerada, pago e depois reembolsado, e pendente.
 *
 * Pedido + itens + entitlement (+ refund) são criados numa única escrita
 * aninhada por pedido: se algo falhar no meio, o Prisma reverte tudo — não
 * sobra item de pedido sem entitlement.
 */
export async function seedOrders(input: OrdersInput) {
  const { buyer1, buyer2, buyer3, seller1, seller3, seller4 } = input
  const { p1, p1RevisionV2, p2, p2RevisionV1, p2RevisionV2, p5, p10, p10Revision } =
    input

  // Order A — PAID, 2 itens de vendedores diferentes (não-founders), comprador2.
  const orderAPaidAt = daysAgo(12)
  const p2Split = splitCommission(p2.priceCents, PLATFORM_COMMISSION_BPS)
  const p10Split = splitCommission(p10.priceCents, PLATFORM_COMMISSION_BPS)
  const orderA = await prisma.order.create({
    data: {
      buyerId: buyer2.id,
      status: OrderStatus.PAID,
      totalCents: p2.priceCents + p10.priceCents,
      stripeCheckoutSessionId: 'cs_test_order_a',
      stripePaymentIntentId: 'pi_test_order_a',
      paidAt: orderAPaidAt,
      createdAt: orderAPaidAt,
      items: {
        create: [
          {
            productId: p2.id,
            revisionId: p2RevisionV1.id, // versão que o comprador tinha no momento da compra
            sellerId: seller3.id,
            priceCents: p2.priceCents,
            commissionBps: PLATFORM_COMMISSION_BPS,
            platformFeeCents: p2Split.platformFeeCents,
            sellerAmountCents: p2Split.sellerAmountCents,
            availableAt: addDays(orderAPaidAt, HOLD_DAYS),
            createdAt: orderAPaidAt,
            entitlement: {
              create: { userId: buyer2.id, productId: p2.id, createdAt: orderAPaidAt },
            },
          },
          {
            productId: p10.id,
            revisionId: p10Revision.id,
            sellerId: seller4.id,
            priceCents: p10.priceCents,
            commissionBps: PLATFORM_COMMISSION_BPS,
            platformFeeCents: p10Split.platformFeeCents,
            sellerAmountCents: p10Split.sellerAmountCents,
            availableAt: addDays(orderAPaidAt, HOLD_DAYS),
            createdAt: orderAPaidAt,
            entitlement: {
              create: { userId: buyer2.id, productId: p10.id, createdAt: orderAPaidAt },
            },
          },
        ],
      },
    },
    include: { items: { include: { entitlement: true } } },
  })
  const entitlementBuyer2P2 = orderA.items.find(
    (item) => item.productId === p2.id,
  )?.entitlement
  if (!entitlementBuyer2P2)
    throw new Error('Seed: entitlement do buyer2 para p2 (Order A) não foi criado.')

  // Order B — PAID, item único de founder com comissão zerada.
  const orderBPaidAt = daysAgo(8)
  const orderB = await prisma.order.create({
    data: {
      buyerId: buyer1.id,
      status: OrderStatus.PAID,
      totalCents: p1.priceCents,
      stripeCheckoutSessionId: 'cs_test_order_b',
      stripePaymentIntentId: 'pi_test_order_b',
      paidAt: orderBPaidAt,
      createdAt: orderBPaidAt,
      items: {
        create: [
          {
            productId: p1.id,
            revisionId: p1RevisionV2.id,
            sellerId: seller1.id,
            priceCents: p1.priceCents,
            commissionBps: 0,
            platformFeeCents: 0,
            sellerAmountCents: p1.priceCents,
            availableAt: addDays(orderBPaidAt, HOLD_DAYS),
            createdAt: orderBPaidAt,
            entitlement: {
              create: { userId: buyer1.id, productId: p1.id, createdAt: orderBPaidAt },
            },
          },
        ],
      },
    },
    include: { items: { include: { entitlement: true } } },
  })
  const entitlementBuyer1P1 = orderB.items.find(
    (item) => item.productId === p1.id,
  )?.entitlement
  if (!entitlementBuyer1P1)
    throw new Error('Seed: entitlement do buyer1 para p1 (Order B) não foi criado.')

  // Order C — pago e depois reembolsado.
  const orderCPaidAt = daysAgo(6)
  const orderCRefundedAt = daysAgo(5)
  const orderC = await prisma.order.create({
    data: {
      buyerId: buyer3.id,
      status: OrderStatus.REFUNDED,
      totalCents: p2.priceCents,
      stripeCheckoutSessionId: 'cs_test_order_c',
      stripePaymentIntentId: 'pi_test_order_c',
      paidAt: orderCPaidAt,
      createdAt: orderCPaidAt,
      items: {
        create: [
          {
            productId: p2.id,
            revisionId: p2RevisionV2.id,
            sellerId: seller3.id,
            status: OrderItemStatus.REFUNDED,
            priceCents: p2.priceCents,
            commissionBps: PLATFORM_COMMISSION_BPS,
            platformFeeCents: p2Split.platformFeeCents,
            sellerAmountCents: p2Split.sellerAmountCents,
            availableAt: addDays(orderCPaidAt, HOLD_DAYS),
            createdAt: orderCPaidAt,
            refund: {
              create: {
                amountCents: p2.priceCents,
                reason: 'Não era compatível com o meu aparelho.',
                status: RefundStatus.SUCCEEDED,
                stripeRefundId: 're_test_order_c',
                processedAt: orderCRefundedAt,
                createdAt: orderCRefundedAt,
              },
            },
            entitlement: {
              create: {
                userId: buyer3.id,
                productId: p2.id,
                revokedAt: orderCRefundedAt,
                createdAt: orderCPaidAt,
              },
            },
          },
        ],
      },
    },
  })

  // Order D — PENDING (checkout iniciado, aguardando confirmação do webhook).
  await prisma.order.create({
    data: {
      buyerId: buyer2.id,
      status: OrderStatus.PENDING,
      totalCents: p5.priceCents,
      stripeCheckoutSessionId: 'cs_test_order_d_pending',
    },
  })

  return {
    orderB,
    orderBPaidAt,
    orderC,
    orderCRefundedAt,
    entitlementBuyer1P1,
    entitlementBuyer2P2,
  }
}
