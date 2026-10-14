import { z } from 'zod'

export const personNameSchema = z
  .string()
  .trim()
  .min(3, 'nameTooShort')
  .max(120, 'nameTooLong')
  .refine((name) => name.split(/\s+/).length >= 2, 'nameNeedsSurname')

export const passwordSchema = z
  .string()
  .min(8, 'passwordTooShort')
  .max(128, 'passwordTooLong')
