'use client'

import { LogOut, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { signOutAction } from '@/actions/authActions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserMenuProps = {
  user: { name: string; email: string; image?: string | null }
}

export function UserMenu({ user }: UserMenuProps) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu do usuário"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{initials || <UserIcon className="size-4" />}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-1.5 py-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/conta/perfil" />}>
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => signOutAction()}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
