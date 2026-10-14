import type { ReactNode } from 'react'
import { StoreHeader } from '@/components/layout/StoreHeader'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
    </>
  )
}
