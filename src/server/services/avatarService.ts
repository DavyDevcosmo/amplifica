import 'server-only'
import { randomUUID } from 'node:crypto'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { createPresignedPutUrl, deleteObject, headObject, publicUrlFor } from '@/lib/r2'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_CONTENT_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const

type AllowedContentType = keyof typeof ALLOWED_CONTENT_TYPES

// Exportadas como funções puras (sem tocar prisma/R2) pra dar pra testar a
// regra de validação sem precisar mockar infraestrutura — mesmo espírito do
// computeLockout em loginThrottleService.ts.
export function isAllowedContentType(value: string): value is AllowedContentType {
  return value in ALLOWED_CONTENT_TYPES
}

export function isValidAvatarSize(size: number): boolean {
  return size > 0 && size <= MAX_AVATAR_BYTES
}

// Avatar mora no bucket público (a URL vai direto no <img>).
function publicBucket() {
  if (!env.R2_PUBLIC_BUCKET) {
    throw new Error('R2 não configurado (faltam variáveis de ambiente)')
  }
  return env.R2_PUBLIC_BUCKET
}

function avatarKeyPrefix(userId: string) {
  return `avatars/${userId}/`
}

/**
 * Gera a URL pré-assinada de upload. Não escreve nada no banco ainda — só
 * depois que o upload terminar de verdade (`confirmAvatar`) é que
 * `user.image` muda, pra nunca apontar pra uma chave que não existe no R2.
 */
export async function createAvatarUpload(
  userId: string,
  contentType: string,
  size: number,
) {
  if (!isAllowedContentType(contentType)) {
    throw new Error('Formato de imagem não aceito (use PNG, JPEG ou WEBP)')
  }
  if (!isValidAvatarSize(size)) {
    throw new Error('Imagem maior que o limite de 2 MB')
  }

  const extension = ALLOWED_CONTENT_TYPES[contentType]
  const key = `${avatarKeyPrefix(userId)}${randomUUID()}.${extension}`
  const uploadUrl = await createPresignedPutUrl(publicBucket(), key, contentType, size)
  return { uploadUrl, key }
}

/**
 * Confere que a chave pertence ao usuário (prefixo `avatars/{userId}/`),
 * atualiza `user.image` e apaga o avatar anterior do bucket — nunca deixa
 * lixo acumulando no R2 a cada troca de foto.
 */
export async function confirmAvatar(userId: string, key: string) {
  if (!key.startsWith(avatarKeyPrefix(userId))) {
    throw new Error('Chave de avatar não pertence a este usuário')
  }
  const bucket = publicBucket()

  // Confere que o upload aconteceu de verdade e respeitou o limite — a URL
  // pré-assinada só *deveria* impedir um PUT maior, mas isso depende de o R2
  // de fato validar o Content-Length assinado; sem essa checagem aqui,
  // `user.image` podia apontar pra uma chave inexistente ou maior que o
  // limite sem ninguém perceber.
  const head = await headObject(bucket, key)
  if (!head?.contentLength || head.contentLength > MAX_AVATAR_BYTES) {
    // O arquivo já foi parar no bucket (o PUT pré-assinado aconteceu antes
    // dessa checagem) — se não apagar aqui, fica lixo órfão em
    // avatars/{userId}/ pra sempre, já que `user.image` nunca vai apontar
    // pra essa chave.
    if (head) {
      await deleteObject(bucket, key).catch((error) =>
        console.error('[avatarService] falha ao apagar upload rejeitado', error),
      )
    }
    throw new Error('Upload não encontrado ou maior que o limite permitido')
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const previousImage = user.image

  await prisma.user.update({
    where: { id: userId },
    data: { image: publicUrlFor(key) },
  })

  const previousKey =
    previousImage && env.R2_PUBLIC_URL && previousImage.startsWith(env.R2_PUBLIC_URL)
      ? previousImage.slice(env.R2_PUBLIC_URL.length + 1)
      : null

  if (previousKey) {
    await deleteObject(bucket, previousKey).catch((error) =>
      console.error('[avatarService] falha ao apagar avatar antigo', error),
    )
  }

  return publicUrlFor(key)
}
