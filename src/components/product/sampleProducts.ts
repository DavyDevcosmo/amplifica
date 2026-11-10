// ⚠ DADOS DE EXEMPLO — placeholder da interface, NÃO vêm do banco.
// Home e página de produto usam isto até existirem `server/queries/
// productQueries.ts` + `server/dto/productDto.ts`. Quando existirem, troque
// os imports por eles e apague este arquivo. Os tipos abaixo são o contrato
// que a DTO precisa entregar para os componentes de produto.

export type ProductKind = 'PRESET' | 'IR' | 'CAPTURE'

// O que o card de produto precisa (serializável, seguro pro client).
export type ProductCardData = {
  slug: string
  // Nome de exibição da pedaleira ("LINE 6 HELIX") e a marca usada no filtro.
  device: string
  brand: string
  kind: ProductKind
  title: string
  description: string
  priceCents: number // 0 = grátis
  compareAtCents?: number // preço "de" riscado, quando há desconto
  founder?: boolean // vendedor do Programa Fundador
}

export type ProductReview = {
  id: string
  name: string
  rating: number
  date: string
  equipment: string
  text: string
}

export type ProductSeller = {
  name: string
  slug: string
  since: number
  packCount: number
  devices: string
  bio: string
  social: { network: 'instagram' | 'youtube' | 'tiktok' | 'spotify'; href: string }[]
}

export type ProductDetail = ProductCardData & {
  about: string[]
  includes: string[]
  rating: { average: number; count: number; distribution: number[] } // 5★..1★
  reviews: ProductReview[]
  seller: ProductSeller
  video?: { title: string; duration: string }
  // Ficha técnica. Firmware vazio = "informado pelo vendedor".
  specs: { device: string; firmware?: string; files?: string; format?: string }
}

export const PEDALBOARD_BRANDS = [
  'LINE 6',
  'KEMPER',
  'BOSS',
  'FRACTAL',
  'MOOER',
  'VALETON',
  'M-VAVE',
  'ZOOM',
] as const

export const SAMPLE_PRODUCTS: ProductCardData[] = [
  {
    slug: 'plexi-68-helix',
    device: 'LINE 6 HELIX',
    brand: 'LINE 6',
    kind: 'PRESET',
    title: 'Plexi 68 — Helix',
    description: 'Plexi com a cadeia completa de palco, já roteada em snapshots.',
    priceCents: 6792,
    compareAtCents: 7990,
    founder: true,
  },
  {
    slug: 'clean-americano-kemper',
    device: 'KEMPER',
    brand: 'KEMPER',
    kind: 'CAPTURE',
    title: 'Clean americano',
    description: 'Profile de combo americano limpo, gravado em estúdio.',
    priceCents: 3990,
  },
  {
    slug: 'tank-g-worship',
    device: 'M-VAVE TANK-G',
    brand: 'M-VAVE',
    kind: 'PRESET',
    title: 'Tank-G worship',
    description: 'Ambiências longas e drive leve para tocar na igreja.',
    priceCents: 1990,
  },
  {
    slug: 'gt-1000-hi-gain',
    device: 'BOSS GT-1000',
    brand: 'BOSS',
    kind: 'PRESET',
    title: 'GT-1000 hi-gain',
    description: 'Dois canais de high gain com noise gate já ajustado.',
    priceCents: 4990,
    compareAtCents: 5990,
    founder: true,
  },
  {
    slug: 'ir-4x12-v30',
    device: 'MOOER GE300',
    brand: 'MOOER',
    kind: 'IR',
    title: 'IR 4x12 V30',
    description: 'Pacote de IRs 4x12 com dois microfones e mixagens prontas.',
    priceCents: 0,
  },
  {
    slug: 'gp-200-blues',
    device: 'VALETON GP-200',
    brand: 'VALETON',
    kind: 'PRESET',
    title: 'GP-200 blues',
    description: 'Crunch dinâmico que limpa no volume da guitarra.',
    priceCents: 2490,
    founder: true,
  },
  {
    slug: 'hx-stomp-ambient',
    device: 'LINE 6 HX STOMP',
    brand: 'LINE 6',
    kind: 'PRESET',
    title: 'HX Stomp ambient',
    description: 'Reverbs e delays em camadas para texturas e intros.',
    priceCents: 3490,
  },
  {
    slug: 'ir-pack-2x12',
    device: 'FRACTAL FM3',
    brand: 'FRACTAL',
    kind: 'IR',
    title: 'IR pack 2x12',
    description: 'IRs de caixa 2x12 aberta para clean e crunch.',
    priceCents: 2990,
  },
  {
    slug: 'jcm-800-helix',
    device: 'LINE 6 HELIX',
    brand: 'LINE 6',
    kind: 'PRESET',
    title: 'JCM 800 — Helix',
    description: 'O crunch britânico clássico, com snapshot de solo.',
    priceCents: 5990,
    compareAtCents: 6990,
    founder: true,
  },
]

// Home mostra os 8 primeiros (o JCM 800 aparece só em "Você também vai gostar").
export const HOME_PRODUCTS = SAMPLE_PRODUCTS.slice(0, 8)

const TIAGO: ProductSeller = {
  name: 'Tiago Ramos',
  slug: 'tiago-ramos',
  since: 2026,
  packCount: 14,
  devices: 'Line 6 e Kemper',
  bio: 'Guitarrista há 15 anos, toco em banda de rock e na igreja. Monto os presets no mesmo equipamento que levo pro palco e testo tudo em PA e em fone antes de publicar.',
  social: [
    { network: 'instagram', href: 'https://www.instagram.com/' },
    { network: 'youtube', href: 'https://www.youtube.com/' },
    { network: 'tiktok', href: 'https://www.tiktok.com/' },
    { network: 'spotify', href: 'https://open.spotify.com/' },
  ],
}

const DETAILS: Record<string, Omit<ProductDetail, keyof ProductCardData>> = {
  'plexi-68-helix': {
    about: [
      'Pack montado em cima de um Plexi de 1968, pensado para rock clássico ao vivo. O limpo abre com o volume da guitarra no máximo e vira crunch quando você aperta a palhetada, sem precisar trocar de preset.',
      'Cada preset já vem com snapshots de base, solo e ambiência, e os IRs foram gravados com dois microfones numa caixa 4x12. Testado em PA de igreja e em fone.',
    ],
    includes: [
      '8 presets com snapshots de base, solo e ambiência',
      '4 IRs de caixa 4x12, dois microfones',
      'Versões com e sem IR externo',
      'Preset de solo com boost e delay',
      'PDF de instalação passo a passo',
      'Atualizações gratuitas do pack',
    ],
    rating: { average: 4.8, count: 12, distribution: [10, 2, 0, 0, 0] },
    reviews: [
      {
        id: 'r1',
        name: 'Marcos V.',
        rating: 5,
        date: '12 out 2026',
        equipment: 'Helix LT',
        text: 'O limpo com crunch no volume é exatamente o que aparece na prévia. Usei no ensaio sem mexer em nada.',
      },
      {
        id: 'r2',
        name: 'Juliana R.',
        rating: 5,
        date: '3 out 2026',
        equipment: 'Helix Floor',
        text: 'Snapshots bem pensados. Só baixei um pouco o reverb do preset de solo para o PA da igreja.',
      },
      {
        id: 'r3',
        name: 'Felipe A.',
        rating: 4,
        date: '28 set 2026',
        equipment: 'Helix Rack',
        text: 'Soa muito bem no fone. No meu PA precisei cortar um pouco de grave nos IRs.',
      },
    ],
    seller: TIAGO,
    video: { title: 'Plexi 68 tocando ao vivo', duration: '4:12' },
    specs: {
      device: 'Line 6 Helix (Floor, LT, Rack)',
      files: '8 presets + 4 IRs',
      format: '.hlx · .wav',
    },
  },
}

const EMPTY_RATING = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }

export function getSampleProduct(slug: string): ProductDetail | null {
  const card = SAMPLE_PRODUCTS.find((product) => product.slug === slug)
  if (!card) return null
  const detail = DETAILS[slug]
  return {
    ...card,
    about: detail?.about ?? [card.description],
    includes: detail?.includes ?? [],
    rating: detail?.rating ?? EMPTY_RATING,
    reviews: detail?.reviews ?? [],
    seller: detail?.seller ?? TIAGO,
    video: detail?.video,
    specs: detail?.specs ?? { device: card.device },
  }
}

// Mesma pedaleira primeiro, depois o resto; nunca o próprio produto.
export function getRelatedProducts(product: ProductCardData, limit = 4) {
  const others = SAMPLE_PRODUCTS.filter((item) => item.slug !== product.slug)
  const sameBrand = others.filter((item) => item.brand === product.brand)
  const rest = others.filter((item) => item.brand !== product.brand)
  return [...sameBrand, ...rest].slice(0, limit)
}

export function discountPercent(product: ProductCardData) {
  if (!product.compareAtCents || product.compareAtCents <= product.priceCents) return 0
  return Math.round((1 - product.priceCents / product.compareAtCents) * 100)
}
