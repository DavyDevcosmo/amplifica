import 'server-only'
import { after } from 'next/server'
import { sendEmail } from '@/lib/email'
import { env } from '@/lib/env'

/**
 * Avisa por e-mail que a senha mudou, pra quem não fez a troca reagir. Roda em
 * `after()`: a resposta da action não espera o Resend, e uma falha de envio
 * não desfaz a troca (só vai pro log).
 */
export function notifyPasswordChanged(to: string) {
  const resetUrl = `${env.BETTER_AUTH_URL}/password/forgot`
  after(() =>
    sendEmail({
      to,
      subject: 'Sua senha foi alterada — Amplifica',
      html: `<p>A senha da sua conta no Amplifica foi alterada e as outras sessões foram encerradas.</p><p>Se foi você, não precisa fazer nada. Se não foi, <a href="${resetUrl}">redefina sua senha</a> agora.</p>`,
      text: `A senha da sua conta no Amplifica foi alterada e as outras sessões foram encerradas.\n\nSe foi você, não precisa fazer nada. Se não foi, redefina sua senha em ${resetUrl}`,
    }).catch((error) => console.error('[email]', error)),
  )
}
