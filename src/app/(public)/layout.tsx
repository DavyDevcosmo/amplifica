import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'

// O cabeçalho fica um nível abaixo: a home usa a versão flutuante (no próprio
// page.tsx) e as demais telas a faixa sólida, via (store)/layout.tsx.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
