import { FileKind } from '@/generated/prisma/enums'
import type {
  EntitlementModel,
  ProductRevisionModel,
  UserModel,
} from '@/generated/prisma/models'
import { prisma } from '@/lib/prisma'
import { daysAgo } from './helpers'

type DownloadsInput = {
  buyer1: UserModel
  buyer2: UserModel
  entitlementBuyer1P1: EntitlementModel
  entitlementBuyer2P2: EntitlementModel
  p1RevisionV2: ProductRevisionModel
  p2RevisionV1: ProductRevisionModel
}

/** Registra um download de cada comprador para demonstrar o histórico de acesso. */
export async function seedDownloads(input: DownloadsInput) {
  const {
    buyer1,
    buyer2,
    entitlementBuyer1P1,
    entitlementBuyer2P2,
    p1RevisionV2,
    p2RevisionV1,
  } = input

  const p1DeliverableV2 = await prisma.productFile.findFirstOrThrow({
    where: { revisionId: p1RevisionV2.id, kind: FileKind.DELIVERABLE },
  })
  await prisma.download.create({
    data: {
      userId: buyer1.id,
      entitlementId: entitlementBuyer1P1.id,
      productFileId: p1DeliverableV2.id,
      createdAt: daysAgo(7),
    },
  })

  const p2DeliverableV1 = await prisma.productFile.findFirstOrThrow({
    where: { revisionId: p2RevisionV1.id, kind: FileKind.DELIVERABLE },
  })
  await prisma.download.create({
    data: {
      userId: buyer2.id,
      entitlementId: entitlementBuyer2P2.id,
      productFileId: p2DeliverableV1.id,
      createdAt: daysAgo(11),
    },
  })
}
