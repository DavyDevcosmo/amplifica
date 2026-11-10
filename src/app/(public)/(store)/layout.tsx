import type { ReactNode } from 'react'
import { StoreHeader } from '@/components/layout/StoreHeader'

// Produto e vender usam o mesmo painel flutuante da home (v4).
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader variant="floating" />
      <main className="flex-1">{children}</main>
    </>
  )
}
