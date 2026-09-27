import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { requireUser } from '@/lib/auth'

// Guard de UX: o `proxy.ts` já faz um redirect otimista por cookie, mas
// quem decide de verdade é o `requireUser()` aqui — ele consulta a sessão no
// banco e, se não houver, redireciona pro login levando o caminho atual (via
// o header `x-pathname` que o proxy repassa) como `callbackUrl`.
export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? undefined
  await requireUser(pathname)

  return <>{children}</>
}
