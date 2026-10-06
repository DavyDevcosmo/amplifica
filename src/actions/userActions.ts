'use server'

import { headers } from 'next/headers'
import { type ActionResult, fail, ok } from '@/lib/actionResult'
import { auth, getSession } from '@/lib/auth'
import {
  authFailure,
  invalidInputFailure,
  sessionExpiredFailure,
} from '@/lib/authErrors'
import {
  type AvatarUploadInput,
  avatarUploadSchema,
  type ChangePasswordInput,
  type ConfirmAvatarInput,
  changePasswordSchema,
  confirmAvatarSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from '@/schemas/userSchema'
import { confirmAvatar, createAvatarUpload } from '@/server/services/avatarService'

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ActionResult<null>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const session = await getSession()
  if (!session) return sessionExpiredFailure()

  try {
    await auth.api.updateUser({
      body: { name: parsed.data.name },
      headers: await headers(),
    })
    return ok(null)
  } catch (error) {
    return authFailure(error)
  }
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult<null>> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const session = await getSession()
  if (!session) return sessionExpiredFailure()

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    })
    return ok(null)
  } catch (error) {
    return authFailure(error)
  }
}

export async function requestAvatarUploadAction(
  input: AvatarUploadInput,
): Promise<ActionResult<{ uploadUrl: string; key: string }>> {
  const parsed = avatarUploadSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const session = await getSession()
  if (!session) return sessionExpiredFailure()

  try {
    const upload = await createAvatarUpload(
      session.user.id,
      parsed.data.contentType,
      parsed.data.size,
    )
    return ok(upload)
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Falha ao gerar upload')
  }
}

export async function confirmAvatarAction(
  input: ConfirmAvatarInput,
): Promise<ActionResult<{ imageUrl: string }>> {
  const parsed = confirmAvatarSchema.safeParse(input)
  if (!parsed.success) {
    return invalidInputFailure(parsed.error.issues[0]?.message)
  }

  const session = await getSession()
  if (!session) return sessionExpiredFailure()

  try {
    const imageUrl = await confirmAvatar(session.user.id, parsed.data.key)
    return ok({ imageUrl })
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Falha ao confirmar avatar')
  }
}
