import { z } from 'zod'

// As mensagens são chaves do namespace `errors` (src/messages/<locale>/errors.json).
export const becomeSellerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'displayNameTooShort')
    .max(40, 'displayNameTooLong'),
  bio: z.string().trim().max(400, 'bioTooLong').optional(),
})
export type BecomeSellerInput = z.infer<typeof becomeSellerSchema>

// Pedaleiras que o vendedor pode marcar no perfil.
export const PROFILE_DEVICES = [
  'Line 6',
  'Kemper',
  'Boss',
  'Fractal',
  'Mooer',
  'Valeton',
  'M-Vave',
  'Zoom',
] as const
export type ProfileDevice = (typeof PROFILE_DEVICES)[number]

const SPOTIFY_PREFIX = 'https://open.spotify.com/'

// Tira espaços e o "@" digitado no começo (o formulário já mostra o "@").
function cleanHandle(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/^@+/, '') : value
}

// Handle opcional: vazio é aceito (campo em branco = sem rede).
function handle(pattern: RegExp, message: string) {
  return z.preprocess(
    cleanHandle,
    z.union([z.literal(''), z.string().regex(pattern, message)]).optional(),
  )
}

function isSpotifyUrl(value: string) {
  if (!value.startsWith(SPOTIFY_PREFIX)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'open.spotify.com'
  } catch {
    return false
  }
}

export const sellerProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'displayNameTooShort')
    .max(40, 'displayNameTooLong'),
  bio: z.string().trim().max(400, 'bioTooLong').optional(),
  city: z.string().trim().max(60, 'cityTooLong').optional(),
  devices: z
    .array(z.enum(PROFILE_DEVICES, 'deviceInvalid'))
    .max(PROFILE_DEVICES.length, 'tooManyDevices')
    .default([]),
  instagram: handle(/^[A-Za-z0-9._]{1,30}$/, 'handleInvalid'),
  tiktok: handle(/^[A-Za-z0-9._]{1,30}$/, 'handleInvalid'),
  youtube: handle(/^[A-Za-z0-9._-]{1,100}$/, 'handleInvalid'),
  spotifyUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || isSpotifyUrl(value), 'spotifyInvalid')
    .optional(),
})
export type SellerProfileInput = z.input<typeof sellerProfileSchema>
export type SellerProfileData = z.output<typeof sellerProfileSchema>
