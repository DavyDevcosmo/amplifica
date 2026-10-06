'use client'

import { useTranslations } from 'next-intl'
import { FieldError } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

// Seis caixas de código (verificação de e-mail e redefinição de senha).
// Erro = borda vermelha nas caixas + mensagem ligada por aria-describedby.
export function OtpCodeField({
  value,
  onChange,
  error,
  errorId,
  disabled,
  showLabel = false,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
  errorId: string
  disabled?: boolean
  // rótulo visível acima das caixas (a tela de redefinição tem; a de verificação
  // não precisa, o título já diz o que fazer)
  showLabel?: boolean
}) {
  const t = useTranslations('auth.code')

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <label
          htmlFor={`${errorId}-input`}
          className="text-sm leading-snug font-semibold"
        >
          {t('label')}
        </label>
      )}
      <InputOTP
        id={`${errorId}-input`}
        maxLength={6}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={showLabel ? undefined : t('label')}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        containerClassName="w-full"
      >
        <InputOTPGroup className="w-full">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              aria-invalid={!!error}
              className="h-(--auth-otp-h) min-w-0 flex-1 text-2xl"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}
