import { z } from 'zod'
import { passwordSchema, personNameSchema } from '@/schemas/commonSchema'

export const updateProfileSchema = z.object({
  name: personNameSchema,
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

const confirmNewPasswordField = z.string().min(1, 'confirmPasswordRequired')

function passwordsMatch(data: { newPassword: string; confirmNewPassword: string }) {
  return data.newPassword === data.confirmNewPassword
}

const passwordsMismatch = {
  message: 'passwordsMismatch',
  path: ['confirmNewPassword'],
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPasswordRequired'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'passwordSameAsCurrent',
    path: ['newPassword'],
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPasswordRequired'),
    newPassword: passwordSchema,
    confirmNewPassword: confirmNewPasswordField,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'passwordSameAsCurrent',
    path: ['newPassword'],
  })
  .refine(passwordsMatch, passwordsMismatch)

// Conta criada só com o Google: não tem senha atual pra conferir.
export const setPasswordSchema = z.object({ newPassword: passwordSchema })
export type SetPasswordInput = z.infer<typeof setPasswordSchema>

export const setPasswordFormSchema = setPasswordSchema
  .extend({ confirmNewPassword: confirmNewPasswordField })
  .refine(passwordsMatch, passwordsMismatch)

export const avatarUploadSchema = z.object({
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  size: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024, 'avatarTooLarge'),
})
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>

export const confirmAvatarSchema = z.object({
  key: z.string().min(1),
})
export type ConfirmAvatarInput = z.infer<typeof confirmAvatarSchema>
