import {
  Device,
  FileKind,
  Instrument,
  ProductStatus,
  ProductType,
  RevisionStatus,
} from '@/generated/prisma/enums'
import type {
  CategoryModel,
  SellerProfileModel,
  TagModel,
  UserModel,
} from '@/generated/prisma/models'
import { prisma } from '@/lib/prisma'
import { daysAgo } from './helpers'

type ProductsInput = {
  admin: UserModel
  seller1: SellerProfileModel
  seller2: SellerProfileModel
  seller3: SellerProfileModel
  seller4: SellerProfileModel
  categoryMetal: CategoryModel
  categoryBlues: CategoryModel
  categoryClean: CategoryModel
  categoryWorship: CategoryModel
  tagHighGain: TagModel
  tagRhythm: TagModel
  tagLead: TagModel
  tagVintage: TagModel
  tagAmbient: TagModel
  tagCleanBoost: TagModel
}

async function createRevisionFiles(revisionId: string, slug: string) {
  await prisma.productFile.createMany({
    data: [
      {
        revisionId,
        kind: FileKind.DELIVERABLE,
        r2Key: `products/${slug}/deliverable.zip`,
        fileName: `${slug}.zip`,
        contentType: 'application/zip',
        sizeBytes: 2_400_000,
      },
      {
        revisionId,
        kind: FileKind.PREVIEW_AUDIO,
        r2Key: `products/${slug}/preview.mp3`,
        fileName: 'preview.mp3',
        contentType: 'audio/mpeg',
        sizeBytes: 1_800_000,
      },
      {
        revisionId,
        kind: FileKind.COVER_IMAGE,
        r2Key: `products/${slug}/cover.jpg`,
        fileName: 'cover.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 240_000,
      },
    ],
  })
}

/**
 * Cria os 10 produtos de referência (P1–P10), cobrindo cada `ProductStatus`,
 * revisões em cada `RevisionStatus` e um bundle. Retorna só o que os outros
 * seeders (orders, downloads, notifications) precisam.
 */
export async function seedProducts(input: ProductsInput) {
  const { admin, seller1, seller2, seller3, seller4 } = input
  const { categoryMetal, categoryBlues, categoryClean, categoryWorship } = input
  const { tagHighGain, tagRhythm, tagLead, tagVintage, tagAmbient, tagCleanBoost } =
    input

  // P1 — PUBLISHED, GUITAR, PRESET: 2 revisões aprovadas + 1 pendente.
  const p1 = await prisma.product.create({
    data: {
      sellerId: seller1.id,
      slug: 'metal-rhythm-kemper-pack',
      instrument: Instrument.GUITAR,
      productType: ProductType.PRESET,
      compatibility: [Device.KEMPER, Device.QUAD_CORTEX],
      status: ProductStatus.PUBLISHED,
      priceCents: 3990,
      title: 'Metal Rhythm Kemper Pack',
      description:
        'Presets de rhythm de metal moderno, inspirados em produções de djent.',
      inspiredBy: 'inspirado em bandas de djent contemporâneas',
      categoryId: categoryMetal.id,
      tags: { connect: [{ id: tagHighGain.id }, { id: tagRhythm.id }] },
      publishedAt: daysAgo(40),
    },
  })
  const p1RevisionV1 = await prisma.productRevision.create({
    data: {
      productId: p1.id,
      version: 1,
      title: p1.title,
      description: p1.description,
      inspiredBy: p1.inspiredBy,
      compatibility: p1.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(41),
      reviewedById: admin.id,
      reviewedAt: daysAgo(40),
    },
  })
  await createRevisionFiles(p1RevisionV1.id, 'metal-rhythm-kemper-pack/v1')
  const p1RevisionV2 = await prisma.productRevision.create({
    data: {
      productId: p1.id,
      version: 2,
      title: p1.title,
      description: `${p1.description} Agora com mais dois patches de solo.`,
      inspiredBy: p1.inspiredBy,
      compatibility: p1.compatibility,
      changelog: 'Adiciona 2 patches de lead e ajusta o noise gate.',
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(20),
      reviewedById: admin.id,
      reviewedAt: daysAgo(18),
    },
  })
  await createRevisionFiles(p1RevisionV2.id, 'metal-rhythm-kemper-pack/v2')
  const p1RevisionV3 = await prisma.productRevision.create({
    data: {
      productId: p1.id,
      version: 3,
      title: p1.title,
      description: `${p1.description} Nova revisão com cabinet IR atualizado.`,
      inspiredBy: p1.inspiredBy,
      compatibility: p1.compatibility,
      changelog: 'Troca o cabinet IR padrão por um mais aberto.',
      status: RevisionStatus.PENDING_REVIEW,
      submittedAt: daysAgo(1),
    },
  })
  await createRevisionFiles(p1RevisionV3.id, 'metal-rhythm-kemper-pack/v3')
  await prisma.product.update({
    where: { id: p1.id },
    data: { liveRevisionId: p1RevisionV2.id },
  })

  // P2 — PUBLISHED, GUITAR, IR: 2 revisões aprovadas (demonstra notificação de nova versão).
  const p2 = await prisma.product.create({
    data: {
      sellerId: seller3.id,
      slug: 'vintage-blues-ir-cab-pack',
      instrument: Instrument.GUITAR,
      productType: ProductType.IR,
      compatibility: [Device.UNIVERSAL_IR],
      status: ProductStatus.PUBLISHED,
      priceCents: 2490,
      title: 'Vintage Blues IR Cab Pack',
      description:
        'Impulse responses de cabinets vintage 1x12 e 2x12 para tons de blues.',
      inspiredBy: 'inspirado em amplificadores valvulados clássicos dos anos 60',
      categoryId: categoryBlues.id,
      tags: { connect: [{ id: tagVintage.id }, { id: tagLead.id }] },
      publishedAt: daysAgo(60),
    },
  })
  const p2RevisionV1 = await prisma.productRevision.create({
    data: {
      productId: p2.id,
      version: 1,
      title: p2.title,
      description: p2.description,
      inspiredBy: p2.inspiredBy,
      compatibility: p2.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(61),
      reviewedById: admin.id,
      reviewedAt: daysAgo(60),
    },
  })
  await createRevisionFiles(p2RevisionV1.id, 'vintage-blues-ir-cab-pack/v1')
  const p2RevisionV2 = await prisma.productRevision.create({
    data: {
      productId: p2.id,
      version: 2,
      title: p2.title,
      description: `${p2.description} Inclui agora 2 capturas adicionais em modo close-mic.`,
      inspiredBy: p2.inspiredBy,
      compatibility: p2.compatibility,
      changelog: 'Adiciona IRs close-mic.',
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(4),
      reviewedById: admin.id,
      reviewedAt: daysAgo(3),
    },
  })
  await createRevisionFiles(p2RevisionV2.id, 'vintage-blues-ir-cab-pack/v2')
  await prisma.product.update({
    where: { id: p2.id },
    data: { liveRevisionId: p2RevisionV2.id },
  })

  // P3 — PUBLISHED, BASS, CAPTURE
  const p3 = await prisma.product.create({
    data: {
      sellerId: seller1.id,
      slug: 'bass-studio-clean-capture',
      instrument: Instrument.BASS,
      productType: ProductType.CAPTURE,
      compatibility: [Device.TONEX],
      status: ProductStatus.PUBLISHED,
      priceCents: 2990,
      title: 'Bass Tone Capture — Studio Clean',
      description:
        'Tone match de um pré de baixo valvulado de estúdio, som limpo e encorpado.',
      categoryId: categoryClean.id,
      tags: { connect: [{ id: tagCleanBoost.id }] },
      publishedAt: daysAgo(15),
    },
  })
  const p3Revision = await prisma.productRevision.create({
    data: {
      productId: p3.id,
      version: 1,
      title: p3.title,
      description: p3.description,
      compatibility: p3.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(16),
      reviewedById: admin.id,
      reviewedAt: daysAgo(15),
    },
  })
  await createRevisionFiles(p3Revision.id, 'bass-studio-clean-capture/v1')
  await prisma.product.update({
    where: { id: p3.id },
    data: { liveRevisionId: p3Revision.id },
  })

  // P4 — PUBLISHED, ACOUSTIC_GUITAR, MIDI_PATCH
  const p4 = await prisma.product.create({
    data: {
      sellerId: seller2.id,
      slug: 'worship-ambient-midi-patch-set',
      instrument: Instrument.ACOUSTIC_GUITAR,
      productType: ProductType.MIDI_PATCH,
      compatibility: [Device.BOSS, Device.HEADRUSH],
      status: ProductStatus.PUBLISHED,
      priceCents: 1990,
      title: 'Worship Ambient MIDI Patch Set',
      description:
        'Patches MIDI para violão com camadas de ambiência para ministração.',
      categoryId: categoryWorship.id,
      tags: { connect: [{ id: tagAmbient.id }] },
      publishedAt: daysAgo(25),
    },
  })
  const p4Revision = await prisma.productRevision.create({
    data: {
      productId: p4.id,
      version: 1,
      title: p4.title,
      description: p4.description,
      compatibility: p4.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(26),
      reviewedById: admin.id,
      reviewedAt: daysAgo(25),
    },
  })
  await createRevisionFiles(p4Revision.id, 'worship-ambient-midi-patch-set/v1')
  await prisma.product.update({
    where: { id: p4.id },
    data: { liveRevisionId: p4Revision.id },
  })

  // P5 — PUBLISHED, BUNDLE (contém só P1, do seller1). Um bundle não pode
  // incluir produto de outro vendedor: OrderItem tem 1 único sellerId, então
  // um bundle com produto de terceiro deixaria esse vendedor sem repasse.
  const p5 = await prisma.product.create({
    data: {
      sellerId: seller1.id,
      slug: 'founders-metal-bundle',
      instrument: Instrument.GUITAR,
      productType: ProductType.BUNDLE,
      compatibility: [Device.KEMPER, Device.QUAD_CORTEX],
      status: ProductStatus.PUBLISHED,
      priceCents: 5490,
      title: "Founder's Metal Bundle",
      description:
        'Bundle com o Metal Rhythm Kemper Pack, com desconto em relação à compra avulsa.',
      categoryId: categoryMetal.id,
      tags: { connect: [{ id: tagHighGain.id }] },
      publishedAt: daysAgo(10),
    },
  })
  const p5Revision = await prisma.productRevision.create({
    data: {
      productId: p5.id,
      version: 1,
      title: p5.title,
      description: p5.description,
      compatibility: p5.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(11),
      reviewedById: admin.id,
      reviewedAt: daysAgo(10),
    },
  })
  await createRevisionFiles(p5Revision.id, 'founders-metal-bundle/v1')
  await prisma.product.update({
    where: { id: p5.id },
    data: { liveRevisionId: p5Revision.id },
  })
  await prisma.bundleItem.createMany({
    data: [{ bundleId: p5.id, productId: p1.id }],
  })

  // P6 — DRAFT, ainda sem revisão submetida
  await prisma.product.create({
    data: {
      sellerId: seller3.id,
      slug: 'unreleased-blues-lead-preset',
      instrument: Instrument.GUITAR,
      productType: ProductType.PRESET,
      compatibility: [Device.FRACTAL],
      status: ProductStatus.DRAFT,
      priceCents: 2490,
      title: 'Blues Lead Preset (rascunho)',
      description:
        'Rascunho de preset de lead para blues, ainda não enviado para revisão.',
      categoryId: categoryBlues.id,
    },
  })

  // P7 — PENDING_REVIEW (vendedora sem KYC pode submeter e ter o produto revisado;
  // só não recebe repasse até concluir o cadastro no Stripe)
  const p7 = await prisma.product.create({
    data: {
      sellerId: seller4.id,
      slug: 'starter-clean-preset-review',
      instrument: Instrument.GUITAR,
      productType: ProductType.PRESET,
      compatibility: [Device.NEURAL_DSP_PLUGIN],
      status: ProductStatus.PENDING_REVIEW,
      priceCents: 1490,
      title: 'Starter Clean Preset',
      description: 'Preset limpo para plugins Neural DSP, aguardando primeira revisão.',
      categoryId: categoryClean.id,
      tags: { connect: [{ id: tagCleanBoost.id }] },
    },
  })
  const p7Revision = await prisma.productRevision.create({
    data: {
      productId: p7.id,
      version: 1,
      title: p7.title,
      description: p7.description,
      compatibility: p7.compatibility,
      status: RevisionStatus.PENDING_REVIEW,
      submittedAt: daysAgo(2),
    },
  })
  await createRevisionFiles(p7Revision.id, 'starter-clean-preset-review/v1')

  // P8 — REJECTED
  const p8 = await prisma.product.create({
    data: {
      sellerId: seller3.id,
      slug: 'rejected-ir-pack',
      instrument: Instrument.GUITAR,
      productType: ProductType.IR,
      compatibility: [Device.UNIVERSAL_IR],
      status: ProductStatus.REJECTED,
      priceCents: 1990,
      title: 'Rejected IR Pack',
      description:
        'Pacote de IRs recusado na moderação por falta de preview de áudio adequado.',
      categoryId: categoryBlues.id,
    },
  })
  await prisma.productRevision.create({
    data: {
      productId: p8.id,
      version: 1,
      title: p8.title,
      description: p8.description,
      compatibility: p8.compatibility,
      status: RevisionStatus.REJECTED,
      submittedAt: daysAgo(7),
      reviewedById: admin.id,
      reviewedAt: daysAgo(6),
      rejectionReason: 'Prévia de áudio ausente e descrição incompleta.',
    },
  })

  // P9 — ARCHIVED (removido do catálogo, mas compradores mantêm acesso)
  const p9 = await prisma.product.create({
    data: {
      sellerId: seller1.id,
      slug: 'archived-legacy-preset',
      instrument: Instrument.GUITAR,
      productType: ProductType.PRESET,
      compatibility: [Device.LINE6_HELIX],
      status: ProductStatus.ARCHIVED,
      priceCents: 1990,
      title: 'Legacy Rhythm Preset (arquivado)',
      description: 'Preset antigo, substituído pelo Metal Rhythm Kemper Pack.',
      categoryId: categoryMetal.id,
      publishedAt: daysAgo(200),
    },
  })
  const p9Revision = await prisma.productRevision.create({
    data: {
      productId: p9.id,
      version: 1,
      title: p9.title,
      description: p9.description,
      compatibility: p9.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(201),
      reviewedById: admin.id,
      reviewedAt: daysAgo(200),
    },
  })
  await createRevisionFiles(p9Revision.id, 'archived-legacy-preset/v1')
  await prisma.product.update({
    where: { id: p9.id },
    data: { liveRevisionId: p9Revision.id },
  })

  // P10 — PUBLISHED, vendedora sem KYC concluído.
  // ATENÇÃO: isso contradiz "vender exige dado bancário" do CLAUDE.md — mantido
  // aqui só como caso de teste até a regra ser confirmada (ver relatório de revisão).
  const p10 = await prisma.product.create({
    data: {
      sellerId: seller4.id,
      slug: 'starter-clean-preset',
      instrument: Instrument.GUITAR,
      productType: ProductType.PRESET,
      compatibility: [Device.NEURAL_DSP_PLUGIN],
      status: ProductStatus.PUBLISHED,
      priceCents: 1490,
      title: 'Starter Clean Preset — Volume 1',
      description: 'Preset limpo para plugins Neural DSP.',
      categoryId: categoryClean.id,
      tags: { connect: [{ id: tagCleanBoost.id }] },
      publishedAt: daysAgo(5),
    },
  })
  const p10Revision = await prisma.productRevision.create({
    data: {
      productId: p10.id,
      version: 1,
      title: p10.title,
      description: p10.description,
      compatibility: p10.compatibility,
      status: RevisionStatus.APPROVED,
      submittedAt: daysAgo(6),
      reviewedById: admin.id,
      reviewedAt: daysAgo(5),
    },
  })
  await createRevisionFiles(p10Revision.id, 'starter-clean-preset/v1')
  await prisma.product.update({
    where: { id: p10.id },
    data: { liveRevisionId: p10Revision.id },
  })

  return { p1, p1RevisionV2, p2, p2RevisionV1, p2RevisionV2, p5, p8, p10, p10Revision }
}
