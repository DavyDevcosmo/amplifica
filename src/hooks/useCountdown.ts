'use client'

import { useEffect, useState } from 'react'

/**
 * Segundos restantes até `targetTimestamp` (epoch ms). Reusado no cooldown
 * de reenvio do código e na mensagem de bloqueio de login. Retorna 0 quando
 * não há alvo ou o alvo já passou.
 */
export function useCountdown(targetTimestamp: number | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(targetTimestamp))

  useEffect(() => {
    setSecondsLeft(remaining(targetTimestamp))
    if (!targetTimestamp) return

    const interval = setInterval(() => {
      setSecondsLeft(remaining(targetTimestamp))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetTimestamp])

  return secondsLeft
}

function remaining(targetTimestamp: number | null) {
  if (!targetTimestamp) return 0
  return Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
}
