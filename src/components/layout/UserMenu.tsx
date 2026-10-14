'use client'

import { User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

type UserMenuProps = {
  user: { name: string; email: string; image?: string | null }
}

// Atalho pro perfil: só o avatar. Sem menu suspenso — o "Sair" fica na
// própria tela de perfil.
export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations('nav')
  const initials = getInitials(user.name)

  return (
    <Link
      href="/account/profile"
      aria-label={t('account')}
      className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar>
        {user.image && <AvatarImage src={user.image} alt="" />}
        <AvatarFallback>{initials || <UserIcon className="size-4" />}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
