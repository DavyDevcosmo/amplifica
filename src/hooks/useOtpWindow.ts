'use client'

import { useCountdown } from '@/hooks/useCountdown'
import { useAuthFlowStore } from '@/stores/authFlowStore'

/**
 * Situação do código atual: quanto falta pra expirar e quantas tentativas
 * restam. `expired` só vale quando há um prazo conhecido — sem prazo (ex.:
 * sessionStorage de antes desta tela) a UI não presume nada e deixa o
 * servidor responder.
 */
export function useOtpWindow() {
  const otpExpiresAt = useAuthFlowStore((state) => state.otpExpiresAt)
  const attemptsLeft = useAuthFlowStore((state) => state.otpAttemptsLeft)
  const secondsLeft = useCountdown(otpExpiresAt)

  return {
    secondsLeft,
    attemptsLeft,
    expired: otpExpiresAt !== null && secondsLeft === 0,
    exhausted: attemptsLeft === 0,
  }
}
