import { z } from 'zod'

// Isomórfico: importado tanto pelo form (client) quanto pela action (server).
// As mensagens de erro são CHAVES do namespace `errors` (src/messages/<locale>/
// errors.json); quem exibe traduz (useTranslations/getTranslations).

// O "confirmar senha" é só conferência de digitação: vale no form (client) e
// NUNCA viaja pra action — por isso há dois schemas. Os `*FormSchema` incluem
// o campo; os demais são o que a action recebe e valida.
const confirmPasswordField = z.string().min(1, 'confirmPasswordRequired')

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword
}

const passwordsMismatch = {
  message: 'passwordsMismatch',
  path: ['confirmPassword'],
}

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'nameTooShort').max(120, 'nameTooLong'),
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

// Tela de nova senha: e-mail e código já vieram dos passos anteriores, então o
// formulário só pede a senha e a confirmação.
export const newPasswordFormSchema = resetPasswordSchema
  .pick({ password: true })
  .extend({ confirmPassword: confirmPasswordField })
  .refine(passwordsMatch, passwordsMismatch)

export const callbackUrlSchema = z.string().optional()
