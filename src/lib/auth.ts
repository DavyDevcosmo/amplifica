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
    resetPasswordTokenExpiresIn: 3600, // 1h
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      sendEmailInBackground({
        to: user.email,
        subject: 'Redefinir senha — Amplifica',
        html: `<p>Clique para redefinir sua senha: <a href="${url}">${url}</a></p><p>O link expira em 1 hora.</p>`,
        text: `Redefina sua senha: ${url} (expira em 1 hora)`,
      })
    },
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
      '/request-password-reset': { window: 60, max: 3 },
    },
  },

  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 600, // 10 min
      allowedAttempts: 5,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subject =
          type === 'sign-in'
            ? 'Seu código de login — Amplifica'
            : 'Confirme seu e-mail — Amplifica'
        sendEmailInBackground({
          to: email,
          subject,
          html: `<p>Seu código: <strong>${otp}</strong></p><p>Ele vale por 10 minutos.</p>`,
          text: `Seu código: ${otp} (vale por 10 minutos)`,
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
        if (returned.statusCode === 401) {
          await registerFailure(ctx.body.email)
        }
        return
      }
      await registerSuccess(ctx.body.email)
    }),
  },
})

// cache() deduplica por request — sem isso, um layout que chama requireUser()
// e uma page dentro dele que chama requireUser() de novo batem duas vezes no
// banco pra buscar a mesma sessão (não há session.cookieCache configurado).
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
