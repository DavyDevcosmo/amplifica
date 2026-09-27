'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { type ActionResult, fail, ok } from '@/lib/actionResult'
import { auth } from '@/lib/auth'
import { authErrorMessage } from '@/lib/authErrors'
import { safeCallbackUrl } from '@/lib/utils'
import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
  type OtpInput,
  otpSchema,
  type ResendCodeInput,
  type ResetPasswordInput,
  resendCodeSchema,
  resetPasswordSchema,
  type SignInInput,
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from '@/schemas/authSchema'

export async function signUpAction(
  input: SignUpInput,
): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    })
    return ok({ email: parsed.data.email })
  } catch (error) {
    return fail(authErrorMessage(error))
  }
}

export async function verifyEmailAction(
  input: OtpInput,
  callbackUrl?: string,
): Promise<ActionResult<null>> {
  const parsed = otpSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  let redirectTo: string
  try {
    await auth.api.verifyEmailOTP({
      body: { email: parsed.data.email, otp: parsed.data.otp },
      headers: await headers(),
    })
    redirectTo = safeCallbackUrl(callbackUrl)
  } catch (error) {
    return fail(authErrorMessage(error))
  }
  redirect(redirectTo)
}

export async function resendCodeAction(
  input: ResendCodeInput,
): Promise<ActionResult<null>> {
  const parsed = resendCodeSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  try {
    await auth.api.sendVerificationOTP({
      body: { email: parsed.data.email, type: 'email-verification' },
      headers: await headers(),
    })
    return ok(null)
  } catch (error) {
    return fail(authErrorMessage(error))
  }
}

export async function signInAction(
  input: SignInInput,
): Promise<ActionResult<{ status: 'signedIn' | 'needsVerification' }>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    })
    return ok({ status: 'signedIn' })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'body' in error
        ? (error as { body?: { code?: string } }).body?.code
        : undefined
    if (code === 'EMAIL_NOT_VERIFIED') {
      // O próprio Better Auth já reenvia o OTP sozinho aqui (emailVerification
      // .sendOnSignIn: true) — chamar resendCodeAction de novo mandaria um
      // segundo código pro mesmo e-mail. Só manda a UI pra tela de verificação.
      return ok({ status: 'needsVerification' })
    }
    return fail(authErrorMessage(error))
  }
}

export async function signOutAction(): Promise<never> {
  await auth.api.signOut({ headers: await headers() })
  redirect('/')
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: '/senha/redefinir' },
      headers: await headers(),
    })
  } catch (error) {
    // nunca revela se o e-mail existe — só loga pra investigar depois
    console.error('[forgotPasswordAction]', error)
  }
  // sempre a mesma resposta, exista ou não o e-mail
  return ok(null)
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Dados inválidos')
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
      headers: await headers(),
    })
    return ok(null)
  } catch (error) {
    return fail(authErrorMessage(error))
  }
}
