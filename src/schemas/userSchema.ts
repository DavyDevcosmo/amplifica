import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Mínimo de 8 caracteres').max(128),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const avatarUploadSchema = z.object({
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  size: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024, 'Imagem maior que o limite de 2 MB'),
})
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>

export const confirmAvatarSchema = z.object({
  key: z.string().min(1),
})
export type ConfirmAvatarInput = z.infer<typeof confirmAvatarSchema>
