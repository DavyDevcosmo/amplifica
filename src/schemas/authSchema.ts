import { z } from 'zod'
import { personNameSchema } from '@/schemas/commonSchema'

const confirmPasswordField = z.string().min(1, 'confirmPasswordRequired')

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword
}

const passwordsMismatch = {
  message: 'passwordsMismatch',
  path: ['confirmPassword'],
}

export const signUpSchema = z.object({
  name: personNameSchema,
  email: z.email('emailInvalid'),
  password: z.string().min(8, 'passwordTooShort').max(128, 'passwordTooLong'),
})
export type SignUpInput = z.infer<typeof signUpSchema>

export const signUpFormSchema = signUpSchema
  .extend({ confirmPassword: confirmPasswordField })
  .refine(passwordsMatch, passwordsMismatch)

export const signInSchema = z.object({
  email: z.email('emailInvalid'),
  password: z.string().min(8, 'passwordTooShort').max(128, 'passwordTooLong'),
})

export type SignInInput = z.infer<typeof signInSchema>

export const otpSchema = z.object({
  email: z.email('emailInvalid'),
  otp: z.string().regex(/^\d{6}$/, 'otpLength'),
})
export type OtpInput = z.infer<typeof otpSchema>

export const resendCodeSchema = z.object({
  email: z.email('emailInvalid'),
})
export type ResendCodeInput = z.infer<typeof resendCodeSchema>

export const forgotPasswordSchema = z.object({
  email: z.email('emailInvalid'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  email: z.email('emailInvalid'),
  otp: z.string().regex(/^\d{6}$/, 'otpLength'),
  password: z.string().min(8, 'passwordTooShort').max(128, 'passwordTooLong'),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const newPasswordFormSchema = resetPasswordSchema
  .pick({ password: true })
  .extend({ confirmPassword: confirmPasswordField })
  .refine(passwordsMatch, passwordsMismatch)

export const callbackUrlSchema = z.string().optional()
