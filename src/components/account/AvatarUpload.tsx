'use client'

import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { confirmAvatarAction, requestAvatarUploadAction } from '@/actions/userActions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { avatarUploadSchema } from '@/schemas/userSchema'

type AvatarUploadProps = {
  user: { name: string; image?: string | null }
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(user.image ?? null)
  const [isPending, startTransition] = useTransition()

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  function handleFile(file: File) {
    const parsed = avatarUploadSchema.safeParse({
      contentType: file.type,
      size: file.size,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Imagem inválida')
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
        toast.error('Falha ao enviar a imagem')
        return
      }

      const confirmResult = await confirmAvatarAction({ key: uploadResult.data.key })
      if (!confirmResult.success) {
        toast.error(confirmResult.error)
        return
      }

      setPreview(confirmResult.data.imageUrl)
      toast.success('Foto atualizada')
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {preview && <AvatarImage src={preview} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Camera />
          {isPending ? 'Enviando…' : 'Trocar foto'}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPEG ou WEBP até 2 MB.
        </p>
      </div>
    </div>
  )
}
