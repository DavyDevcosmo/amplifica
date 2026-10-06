import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// Client do Better Auth. Quase tudo passa por Server Action — aqui só o que
// PRECISA rodar no navegador, como o redirect do OAuth do Google.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
})
