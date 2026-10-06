'use client'

import { useSyncExternalStore } from 'react'
import { useAuthFlowStore } from '@/stores/authFlowStore'

function subscribe(onChange: () => void) {
  return useAuthFlowStore.persist.onFinishHydration(onChange)
}

/**
 * `true` só depois que o persist (sessionStorage) já foi lido no client.
 * No servidor e na primeira renderização de hidratação, o zustand devolve o
 * estado inicial (tudo nulo); decidir um redirect nesse momento mandava a
 * pessoa embora num F5. Quem redireciona por "falta de e-mail" precisa
 * esperar este flag.
 */
export function useAuthFlowHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useAuthFlowStore.persist.hasHydrated(),
    () => false,
  )
}
