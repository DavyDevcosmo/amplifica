import { prisma } from '@/lib/prisma'

/** Cria as categorias e tags usadas pelos produtos do seed. */
export async function seedCatalog() {
  const [categoryMetal, categoryBlues, categoryClean, categoryWorship] =
    await Promise.all([
      prisma.category.create({ data: { name: 'Metal', slug: 'metal' } }),
      prisma.category.create({ data: { name: 'Blues', slug: 'blues' } }),
      prisma.category.create({ data: { name: 'Clean', slug: 'clean' } }),
      prisma.category.create({ data: { name: 'Worship', slug: 'worship' } }),
    ])

  const [tagHighGain, tagRhythm, tagLead, tagVintage, tagAmbient, tagCleanBoost] =
    await Promise.all([
      prisma.tag.create({ data: { name: 'High Gain', slug: 'high-gain' } }),
      prisma.tag.create({ data: { name: 'Rhythm', slug: 'rhythm' } }),
      prisma.tag.create({ data: { name: 'Lead', slug: 'lead' } }),
      prisma.tag.create({ data: { name: 'Vintage', slug: 'vintage' } }),
      prisma.tag.create({ data: { name: 'Ambient', slug: 'ambient' } }),
      prisma.tag.create({ data: { name: 'Clean Boost', slug: 'clean-boost' } }),
    ])

  return {
    categoryMetal,
    categoryBlues,
    categoryClean,
    categoryWorship,
    tagHighGain,
    tagRhythm,
    tagLead,
    tagVintage,
    tagAmbient,
    tagCleanBoost,
  }
}
