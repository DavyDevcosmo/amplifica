import { NotificationType } from '@/generated/prisma/enums'
import type { OrderModel, ProductModel, UserModel } from '@/generated/prisma/models'
import { prisma } from '@/lib/prisma'
import { daysAgo } from './helpers'

type NotificationsInput = {
  seller1User: UserModel
  seller3User: UserModel
  buyer2: UserModel
  p1: ProductModel
  p2: ProductModel
  p8: ProductModel
  orderB: OrderModel
  orderBPaidAt: Date
  orderC: OrderModel
  orderCRefundedAt: Date
}

/** Cria uma notificação de exemplo para cada `NotificationType`. */
export async function seedNotifications(input: NotificationsInput) {
  const {
    seller1User,
    seller3User,
    buyer2,
    p1,
    p2,
    p8,
    orderB,
    orderBPaidAt,
    orderC,
    orderCRefundedAt,
  } = input

  await prisma.notification.createMany({
    data: [
      {
        userId: seller1User.id,
        type: NotificationType.NEW_SALE,
        productId: p1.id,
        orderId: orderB.id,
        createdAt: orderBPaidAt,
        readAt: daysAgo(7),
      },
      {
        userId: seller1User.id,
        type: NotificationType.PRODUCT_APPROVED,
        productId: p1.id,
        createdAt: daysAgo(18),
        readAt: daysAgo(17),
      },
      {
        userId: seller3User.id,
        type: NotificationType.PRODUCT_REJECTED,
        productId: p8.id,
        createdAt: daysAgo(6),
      },
      {
        userId: seller3User.id,
        type: NotificationType.REFUND_ISSUED,
        productId: p2.id,
        orderId: orderC.id,
        createdAt: orderCRefundedAt,
      },
      {
        userId: buyer2.id,
        type: NotificationType.PRODUCT_UPDATED,
        productId: p2.id,
        createdAt: daysAgo(3),
      },
    ],
  })
}
