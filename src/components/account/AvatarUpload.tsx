'use client'

import { Camera, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { confirmAvatarAction, requestAvatarUploadAction } from '@/actions/userActions'
import { useIssueTranslator } from '@/components/auth/fieldErrors'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getInitials } from '@/lib/utils'
import { avatarUploadSchema } from '@/schemas/userSchema'

type AvatarUploadProps = {
  user: { name: string; image?: string | null }
  // 'pencil': avatar grande com um botão de lápis sobreposto no canto (perfil
  // do vendedor). O padrão é o avatar pequeno com o botão "Trocar foto".
  variant?: 'default' | 'pencil'
  // Avisa a URL da foto nova depois que o upload é confirmado.
  onUploaded?: (imageUrl: string) => void
}

export function AvatarUpload({
  user,
  variant = 'default',
  onUploaded,
}: AvatarUploadProps) {
  const t = useTranslations('account')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(user.image ?? null)
  const [isPending, startTransition] = useTransition()

  const initials = getInitials(user.name)

  function handleFile(file: File) {
    const parsed = avatarUploadSchema.safeParse({
      contentType: file.type,
      size: file.size,
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message
      toast.error(message ? translateIssue(message) : t('invalidImage'))
      return
    }

    startTransition(async () => {
      const uploadResult = await requestAvatarUploadAction(parsed.data)
      if (!uploadResult.success) {
        toast.error(uploadResult.error)
        return
      }

      const putResponse = await fetch(uploadResult.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putResponse.ok) {
        toast.error(t('uploadFailed'))
        return
      }

      const confirmResult = await confirmAvatarAction({ key: uploadResult.data.key })
      if (!confirmResult.success) {
        toast.error(confirmResult.error)
        return
      }

      setPreview(confirmResult.data.imageUrl)
      onUploaded?.(confirmResult.data.imageUrl)
      toast.success(t('photoUpdated'))
      router.refresh()
    })
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = ''
      }}
    />
  )

  if (variant === 'pencil') {
    return (
      <div className="flex flex-wrap items-center gap-5">
        <span className="relative size-28 flex-none">
          <Avatar className="size-28 border-2 border-celeste after:hidden">
            {preview && <AvatarImage src={preview} alt="" />}
            <AvatarFallback className="bg-marinho text-3xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {fileInput}
          <button
            type="button"
            aria-label={t('changePhotoLabel')}
            title={t('changePhotoLabel')}
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            className="absolute -right-0.5 -bottom-0.5 grid size-9 place-items-center rounded-full border-[3px] border-card bg-azul text-white outline-none after:absolute after:-inset-1 after:content-[''] hover:bg-azul-forte focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isPending ? (
              <Spinner className="size-4" aria-hidden />
            ) : (
              <Pencil className="size-4" aria-hidden />
            )}
          </button>
        </span>
        <p className="max-w-[36ch] text-[0.8125rem] leading-[1.1875rem] text-ardosia">
          {t('photoHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {preview && <AvatarImage src={preview} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        {fileInput}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Camera />
          {isPending ? t('uploading') : t('changePhoto')}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">{t('photoHint')}</p>
      </div>
    </div>
  )
}
