import 'server-only'
import { z } from 'zod'

// Valida as variáveis de ambiente uma única vez, no import — falha cedo (no
// boot do servidor) em vez de deixar um `undefined` vazar até um `fetch` ou
// uma query dar erro obscuro em produção.
//
// Só é obrigatório o que o app não roda sem. O resto é opcional: sem
// GOOGLE_CLIENT_ID/SECRET o botão do Google some, sem RESEND_API_KEY o
// e-mail cai pro console, sem as variáveis do R2 o upload de avatar fica
// indisponível.
const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
    DIRECT_URL: z.string().min(1, 'DIRECT_URL é obrigatória'),
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET é obrigatória'),
    BETTER_AUTH_URL: z.url('BETTER_AUTH_URL precisa ser uma URL válida'),

    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.email().optional(),
    EMAIL_TRANSPORT: z.enum(['resend', 'console', 'file']).default('console'),

    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_PUBLIC_BUCKET: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.url().optional(),

    CRON_SECRET: z.string().min(1).optional(),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Setado pelo playwright.config.ts / .env.e2e — nunca à mão.
    E2E: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
  })
  .refine(
    (env) => !env.GOOGLE_CLIENT_ID === !env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET têm que ser definidos juntos',
  )
  .refine(
    (env) => env.EMAIL_TRANSPORT !== 'resend' || !!env.RESEND_API_KEY,
    'EMAIL_TRANSPORT=resend exige RESEND_API_KEY',
  )

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.treeifyError(parsed.error))
  throw new Error('Variáveis de ambiente inválidas — veja o log acima.')
}

export const env = parsed.data

export const googleOAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
)

export const r2Enabled = Boolean(
  env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_PUBLIC_BUCKET &&
    env.R2_PUBLIC_URL,
)
