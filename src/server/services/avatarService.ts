import 'server-only'
import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { createPresignedPutUrl, publicUrlFor, r2Client } from '@/lib/r2'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_CONTENT_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const

type AllowedContentType = keyof typeof ALLOWED_CONTENT_TYPES

function isAllowedContentType(value: string): value is AllowedContentType {
  return value in ALLOWED_CONTENT_TYPES
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
  if (size <= 0 || size > MAX_AVATAR_BYTES) {
    throw new Error('Imagem maior que o limite de 2 MB')
  }

  const extension = ALLOWED_CONTENT_TYPES[contentType]
  const key = `${avatarKeyPrefix(userId)}${randomUUID()}.${extension}`
  const uploadUrl = await createPresignedPutUrl(key, contentType, size)
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
  if (!r2Client) {
    throw new Error('R2 não configurado (faltam variáveis de ambiente)')
  }

  // Confere que o upload aconteceu de verdade e respeitou o limite — a URL
  // pré-assinada só *deveria* impedir um PUT maior, mas isso depende de o R2
  // de fato validar o Content-Length assinado; sem essa checagem aqui,
  // `user.image` podia apontar pra uma chave inexistente ou maior que o
  // limite sem ninguém perceber.
  const head = await r2Client
    .send(new HeadObjectCommand({ Bucket: env.R2_PUBLIC_BUCKET, Key: key }))
    .catch(() => null)
  if (!head?.ContentLength || head.ContentLength > MAX_AVATAR_BYTES) {
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

  if (previousKey && r2Client) {
    await r2Client
      .send(new DeleteObjectCommand({ Bucket: env.R2_PUBLIC_BUCKET, Key: previousKey }))
      .catch((error) =>
        console.error('[avatarService] falha ao apagar avatar antigo', error),
      )
  }

  return publicUrlFor(key)
}
