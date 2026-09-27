import { z } from 'zod'

// Isomórfico: importado tanto pelo form (client) quanto pela action (server).

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto').max(120),
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'Mínimo de 8 caracteres').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type SignInInput = z.infer<typeof signInSchema>

export const otpSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/, 'O código tem 6 dígitos'),
})
export type OtpInput = z.infer<typeof otpSchema>

export const resendCodeSchema = z.object({
  email: z.email(),
})
export type ResendCodeInput = z.infer<typeof resendCodeSchema>

export const forgotPasswordSchema = z.object({
  email: z.email('E-mail inválido'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'Mínimo de 8 caracteres').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const callbackUrlSchema = z.string().optional()
