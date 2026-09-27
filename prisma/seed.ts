import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { seedCatalog } from './seed/catalog'
import { seedDownloads } from './seed/downloads'
import { seedNotifications } from './seed/notifications'
import { seedOrders } from './seed/orders'
import { seedProducts } from './seed/products'
import { seedUsersAndSellers } from './seed/users'
import { wipe } from './seed/wipe'

async function main() {
  await wipe()

  const {
    admin,
    buyer1,
    buyer2,
    buyer3,
    seller1User,
    seller3User,
    seller1,
    seller2,
    seller3,
    seller4,
  } = await seedUsersAndSellers()

  const catalog = await seedCatalog()

  const { p1, p1RevisionV2, p2, p2RevisionV1, p2RevisionV2, p5, p8, p10, p10Revision } =
    await seedProducts({
      admin,
      seller1,
      seller2,
      seller3,
      seller4,
      ...catalog,
    })

  const {
    orderB,
    orderBPaidAt,
    orderC,
    orderCRefundedAt,
    entitlementBuyer1P1,
    entitlementBuyer2P2,
  } = await seedOrders({
    buyer1,
    buyer2,
    buyer3,
    seller1,
    seller3,
    seller4,
    p1,
    p1RevisionV2,
    p2,
    p2RevisionV1,
    p2RevisionV2,
    p5,
    p10,
    p10Revision,
  })

  await seedDownloads({
    buyer1,
    buyer2,
    entitlementBuyer1P1,
    entitlementBuyer2P2,
    p1RevisionV2,
    p2RevisionV1,
  })

  await seedNotifications({
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
  })

  const [users, sellers, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count(),
    prisma.product.count(),
    prisma.order.count(),
  ])
  console.log('Seed concluído:', { users, sellers, products, orders })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
