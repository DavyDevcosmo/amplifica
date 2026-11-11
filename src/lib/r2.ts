import 'server-only'
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env, r2Enabled } from '@/lib/env'

// Cliente S3 apontando para o endpoint do R2 (compatível com a API do S3).
// Só é instanciado se as variáveis do R2 estiverem presentes — ver
// `r2Enabled` em lib/env.ts. O mesmo client atende o bucket público
// (avatares, prévia, capa) e o privado (entregáveis): o bucket vai em cada
// chamada.
export const r2Client = r2Enabled
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        // biome-ignore lint/style/noNonNullAssertion: r2Enabled já confere que essas duas existem
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        // biome-ignore lint/style/noNonNullAssertion: r2Enabled já confere que essas duas existem
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : undefined

function requireClient() {
  if (!r2Client) {
    throw new Error('R2 não configurado (faltam variáveis de ambiente)')
  }
  return r2Client
}

/**
 * URL pré-assinada de upload direto (PUT) para `bucket`.
 * `contentType` e `contentLength` ficam assinados na URL: o R2 rejeita o PUT
 * se o cliente mandar um Content-Type ou Content-Length diferentes do
 * combinado aqui — o navegador não consegue enviar um arquivo maior do que o
 * tamanho que o service já validou antes de pedir a URL.
 */
export async function createPresignedPutUrl(
  bucket: string,
  key: string,
  contentType: string,
  contentLength: number,
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })
  return getSignedUrl(requireClient(), command, {
    expiresIn: 60 * 5, // 5 minutos para o upload acontecer
    signableHeaders: new Set(['content-type']),
  })
}

/** Metadados do objeto, ou `null` se ele não existe (ou o R2 falhou). */
export async function headObject(
  bucket: string,
  key: string,
): Promise<{ contentLength: number; contentType?: string } | null> {
  const head = await requireClient()
    .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => null)
  if (!head) return null
  return { contentLength: head.ContentLength ?? 0, contentType: head.ContentType }
}

export async function deleteObject(bucket: string, key: string) {
  await requireClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export function publicUrlFor(key: string) {
  return `${env.R2_PUBLIC_URL}/${key}`
}
