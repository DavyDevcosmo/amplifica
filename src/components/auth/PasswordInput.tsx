'use client'

import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { IconInput } from '@/components/auth/IconInput'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'

export function PasswordInput(props: Omit<React.ComponentProps<'input'>, 'type'>) {
  const t = useTranslations('auth.shared')
  const [visible, setVisible] = useState(false)

  return (
    <IconInput
      icon={LockIcon}
      type={visible ? 'text' : 'password'}
      endAddon={
        <InputGroupAddon align="inline-end" className="pr-0">
          <InputGroupButton
            aria-label={visible ? t('hidePassword') : t('showPassword')}
            aria-pressed={visible}
            disabled={props.disabled}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
          </InputGroupButton>
        </InputGroupAddon>
      }
      {...props}
    />
  )
}
