import 'server-only'
import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP } from 'better-auth/plugins'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { cache } from 'react'
import { sendEmail } from '@/lib/email'
import { env, googleOAuthEnabled } from '@/lib/env'
import { OTP_EXPIRES_IN_SECONDS, OTP_MAX_ATTEMPTS } from '@/lib/otpConfig'
import { prisma } from '@/lib/prisma'
import {
  assertNotLocked,
  registerFailure,
  registerSuccess,
} from '@/server/services/loginThrottleService'
import {
  assertSignupNotExpired,
  purgeExpiredUnverified,
} from '@/server/services/pendingSignupService'

// Os envios de e-mail usam `after()` (next/server) sem `await`: a resposta
// do endpoint não pode variar de tempo conforme o e-mail existir ou não (a
// própria doc do Better Auth recomenda isso pra não vazar timing attack).
const OTP_EXPIRES_IN_MINUTES = OTP_EXPIRES_IN_SECONDS / 60

function sendEmailInBackground(input: Parameters<typeof sendEmail>[0]) {
  after(() => sendEmail(input).catch((error) => console.error('[email]', error)))
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    // A redefinição é por código de 6 dígitos (plugin emailOTP, type
    // 'forget-password'), sem link com token — por isso não há sendResetPassword.
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    ...(googleOAuthEnabled
      ? {
          google: {
            // biome-ignore lint/style/noNonNullAssertion: googleOAuthEnabled já confere que essas duas existem
            clientId: env.GOOGLE_CLIENT_ID!,
            // biome-ignore lint/style/noNonNullAssertion: googleOAuthEnabled já confere que essas duas existem
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            mapProfileToUser: (profile) => ({
              name: profile.name,
              image: profile.picture,
            }),
          },
        }
      : {}),
  },

  session: {
    // Sem isso, toda navegação chamava getSession() → 1 query no Neon (a
    // dedução do cache() do React só evita repetir a query dentro do MESMO
    // request, não entre requests). Com cookieCache, a sessão fica assinada
    // num cookie por até 5 min e getSession() só bate no banco quando o
    // cookie expira ou some — troca-se "sessão revogada demora até 5 min pra
    // parar de valer" por uma navegação sem ida ao banco na maioria dos
    // cliques. Pra forçar a leitura fresca (ex.: depois de banir um usuário
    // na hora), use `auth.api.getSession({ query: { disableCookieCache: true } })`.
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 min
    },
  },

  user: {
    additionalFields: {
      role: {
        type: ['USER', 'ADMIN'],
        required: false,
        defaultValue: 'USER',
        input: false,
      },
      status: {
        type: ['ACTIVE', 'SUSPENDED', 'BANNED'],
        required: false,
        defaultValue: 'ACTIVE',
        input: false,
      },
    },
  },

  rateLimit: {
    enabled: true,
    // memória não sobrevive entre invocações serverless — precisa ser banco.
    storage: 'database',
    customRules: {
      '/email-otp/send-verification-otp': { window: 60, max: 1 }, // cooldown de reenvio
      '/sign-in/email': { window: 60, max: 10 },
      '/email-otp/request-password-reset': { window: 60, max: 3 }, // cooldown de reenvio
      '/email-otp/reset-password': { window: 60, max: 10 },
    },
  },

  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      // errou o código `allowedAttempts` vezes → só um código novo resolve
      allowedAttempts: OTP_MAX_ATTEMPTS,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subject =
          type === 'sign-in'
            ? 'Seu código de login — Amplifica'
            : type === 'forget-password'
              ? 'Seu código para redefinir a senha — Amplifica'
              : 'Confirme seu e-mail — Amplifica'
        sendEmailInBackground({
          to: email,
          subject,
          html: `<p>Seu código: <strong>${otp}</strong></p><p>Ele vale por ${OTP_EXPIRES_IN_MINUTES} minutos.</p>`,
          text: `Seu código: ${otp} (vale por ${OTP_EXPIRES_IN_MINUTES} minutos)`,
        })
      },
    }),
    // Precisa ser o último plugin — ele escreve o Set-Cookie na resposta.
    nextCookies(),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email' && ctx.body?.email) {
        await assertNotLocked(ctx.body.email)
        return
      }
      if (ctx.path === '/sign-up/email' && ctx.body?.email) {
        // libera o e-mail pra recadastro se o cadastro anterior expirou
        await purgeExpiredUnverified(ctx.body.email)
        return
      }
      if (
        (ctx.path === '/email-otp/send-verification-otp' ||
          ctx.path === '/email-otp/verify-email') &&
        ctx.body?.email
      ) {
        await assertSignupNotExpired(ctx.body.email)
        return
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email' || !ctx.body?.email) return

      const returned = ctx.context.returned
      if (returned instanceof APIError) {
        // síncrono de propósito: o próximo /sign-in/email do mesmo e-mail
        // precisa enxergar esse failedCount já gravado, senão duas
        // tentativas erradas em sequência rápida poderiam escapar do
        // bloqueio progressivo.
        if (returned.statusCode === 401) {
          await registerFailure(ctx.body.email)
        }
        return
      }
      // login deu certo: limpar o throttle não precisa atrasar a resposta
      // (não há mais tentativa errada pra bloquear depois disso).
      const email = ctx.body.email
      after(() =>
        registerSuccess(email).catch((error) => console.error('[auth]', error)),
      )
    }),
  },
})

// cache() deduplica por request — sem isso, um layout que chama requireUser()
// e uma page dentro dele que chama requireUser() de novo bateriam duas vezes
// na mesma fonte (banco ou cookieCache) pra buscar a mesma sessão.
export const getSession = cache(async function getSession() {
  return auth.api.getSession({ headers: await headers() })
})

export async function requireUser(callbackPath?: string) {
  const session = await getSession()
  if (!session) {
    const callbackUrl = callbackPath
      ? `?callbackUrl=${encodeURIComponent(callbackPath)}`
      : ''
    redirect(`/login${callbackUrl}`)
  }
  return session.user
}

export async function requireRole(role: 'USER' | 'ADMIN', callbackPath?: string) {
  const user = await requireUser(callbackPath)
  if (user.role !== role) {
    redirect('/')
  }
  return user
}
