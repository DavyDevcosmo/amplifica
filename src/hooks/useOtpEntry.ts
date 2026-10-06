'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { type OtpError, otpErrorKind } from '@/components/auth/otpError'
import { useCountdown } from '@/hooks/useCountdown'
import { useOtpWindow } from '@/hooks/useOtpWindow'
import type { ActionResult } from '@/lib/actionResult'
import { useAuthFlowStore } from '@/stores/authFlowStore'

/**
 * Tudo que as telas de código de 6 dígitos (verificação de e-mail e
 * redefinição de senha) têm em comum: o valor digitado, o aviso de erro, o
 * prazo/tentativas do código e o reenvio. Cada tela só decide o que acontece
 * ao confirmar o código e qual action reenvia.
 *
 * O prazo e as tentativas vêm da store (espelho do servidor). `expired` e
 * `exhausted` mandam na tela: bloqueiam o envio, mostram o aviso e liberam o
 * reenvio sem esperar o cooldown — só um código novo resolve.
 */
export function useOtpEntry({
  resend,
}: {
  // dispara o envio de um código novo; devolve o resultado da action
  resend: () => Promise<ActionResult<unknown>>
}) {
  const tCode = useTranslations('auth.code')
  const [isResending, startResendTransition] = useTransition()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<OtpError>()
  const [resendMessage, setResendMessage] = useState<string>()

  const resendAvailableAt = useAuthFlowStore((state) => state.resendAvailableAt)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const startOtpWindow = useAuthFlowStore((state) => state.startOtpWindow)
  const registerOtpFailure = useAuthFlowStore((state) => state.registerOtpFailure)
  const expireOtp = useAuthFlowStore((state) => state.expireOtp)
  const exhaustOtp = useAuthFlowStore((state) => state.exhaustOtp)
  const cooldownSecondsLeft = useCountdown(resendAvailableAt)
  const otpWindow = useOtpWindow()

  const submitBlocked = otpWindow.expired || otpWindow.exhausted
  const canResend = cooldownSecondsLeft === 0 || submitBlocked

  // O estado do código (expirou/esgotou) tem prioridade sobre o último erro.
  const message = otpWindow.expired
    ? tCode('expired')
    : otpWindow.exhausted
      ? tCode('exhausted')
      : error?.text

  function handleChange(value: string) {
    setOtp(value)
    // dígito errado: ao editar, o aviso e a borda vermelha saem
    if (error?.kind === 'invalid') setError(undefined)
  }

  // Valor/erro local antes de chamar a action (ex.: menos de 6 dígitos).
  function showError(text: string) {
    setError({ kind: 'other', text })
  }

  function clearError() {
    setError(undefined)
  }

  // Interpreta a falha de uma action que confere o código e atualiza a store.
  function reportFailure(result: { error: string; code?: string }) {
    const kind = otpErrorKind(result.code)
    if (kind === 'invalid') {
      registerOtpFailure()
      setError({ kind, text: tCode('invalid') })
    } else if (kind === 'expired') {
      expireOtp()
      setError(undefined)
    } else if (kind === 'exhausted') {
      exhaustOtp()
      setError(undefined)
    } else {
      setError({ kind, text: result.error })
    }
  }

  function handleResend() {
    setResendMessage(undefined)
    startResendTransition(async () => {
      const result = await resend()
      if (!result.success) {
        setResendMessage(result.error)
        return
      }
      setResendAvailableAt(Date.now() + 60_000)
      startOtpWindow()
      setResendMessage(tCode('resent'))
      setError(undefined)
      setOtp('')
    })
  }

  return {
    otp,
    message,
    handleChange,
    showError,
    clearError,
    reportFailure,
    submitBlocked,
    otpWindow,
    resend: {
      canResend,
      secondsLeft: cooldownSecondsLeft,
      isResending,
      message: resendMessage,
      onResend: handleResend,
    },
  }
}
