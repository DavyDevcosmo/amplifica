'use client'

import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

const DEBOUNCE_MS = 300

// Busca por nome da lista de produtos. Escreve `?q=` na URL depois de 300 ms
// sem digitar (a página filtra no servidor) e mantém `?situacao=`.
export function ProductSearch({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations('seller.products.search')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const debounced = useDebounce(value.trim(), DEBOUNCE_MS)

  useEffect(() => {
    if (debounced === (searchParams.get('q') ?? '')) return
    const params = new URLSearchParams(searchParams.toString())
    if (debounced) params.set('q', debounced)
    else params.delete('q')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [debounced, searchParams, router])

  return (
    <label className="relative flex min-w-60 flex-1 items-center sm:max-w-80 sm:flex-none">
      <span className="sr-only">{t('label')}</span>
      <SearchIcon
        className="pointer-events-none absolute left-4 size-[18px] text-ardosia"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('placeholder')}
        className="min-h-11 w-full rounded-full border-[1.5px] border-ardosia/35 bg-field pr-4 pl-11 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-azul"
      />
    </label>
  )
}
