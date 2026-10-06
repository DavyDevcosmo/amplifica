import 'server-only'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env, r2Enabled } from '@/lib/env'

// Cliente S3 apontando para o endpoint do R2 (compatível com a API do S3).
// Só é instanciado se as variáveis do R2 estiverem presentes — ver
// `r2Enabled` em lib/env.ts. Os arquivos de produto (entregáveis) usam um
// bucket privado separado, criado depois; este client aqui é só do bucket
// público de avatares.
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

/**
 * URL pré-assinada de upload direto (PUT) para o bucket público do R2.
 * `contentType` e `contentLength` ficam assinados na URL: o R2 rejeita o PUT
 * se o cliente mandar um Content-Type ou Content-Length diferentes do
 * combinado aqui — o navegador não consegue enviar um arquivo maior do que o
 * tamanho que o service já validou antes de pedir a URL.
 */
export async function createPresignedPutUrl(
  key: string,
  contentType: string,
  contentLength: number,
) {
  if (!r2Client) {
    throw new Error('R2 não configurado (faltam variáveis de ambiente)')
  }
  const command = new PutObjectCommand({
    Bucket: env.R2_PUBLIC_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })
  return getSignedUrl(r2Client, command, {
    expiresIn: 60 * 5, // 5 minutos para o upload acontecer
    signableHeaders: new Set(['content-type']),
  })
}

export function publicUrlFor(key: string) {
  return `${env.R2_PUBLIC_URL}/${key}`
}
