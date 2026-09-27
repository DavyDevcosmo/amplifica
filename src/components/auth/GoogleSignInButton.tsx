'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/authClient'
import { safeCallbackUrl } from '@/lib/utils'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.67-.22-2.46H12v4.65h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3a7.4 7.4 0 0 1-11-3.9H1.06v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.07 14.19a7.2 7.2 0 0 1 0-4.38V6.72H1.06a12 12 0 0 0 0 10.56l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.06 6.72l4.01 3.09A7.18 7.18 0 0 1 12 4.77Z"
      />
    </svg>
  )
}

export function GoogleSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        setIsPending(true)
        authClient.signIn.social({
          provider: 'google',
          callbackURL: safeCallbackUrl(callbackUrl),
        })
      }}
    >
      <GoogleIcon />
      Continuar com o Google
    </Button>
  )
}
