import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Resend } from 'resend'
import { env } from '@/lib/env'

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text?: string
}

// Pasta lida pelo Playwright em modo E2E (ver e2e/helpers/readMailbox.ts) —
// nunca deve ir para produção: `EMAIL_TRANSPORT` no `.env.e2e` é o único
// lugar que ativa esse caminho.
const MAILBOX_DIR = path.join(process.cwd(), '.e2e', 'mailbox')

function mailboxFileFor(to: string) {
  // e-mail vira nome de arquivo seguro (troca tudo que não é alfanumérico)
  const safe = to.replace(/[^a-zA-Z0-9@._-]/g, '_')
  return path.join(MAILBOX_DIR, `${safe}.json`)
}

async function sendViaFile(input: SendEmailInput) {
  await mkdir(MAILBOX_DIR, { recursive: true })
  await writeFile(
    mailboxFileFor(input.to),
    JSON.stringify({ ...input, sentAt: new Date().toISOString() }, null, 2),
    'utf-8',
  )
}

function sendViaConsole(input: SendEmailInput) {
  console.log(
    `[email] para ${input.to} — ${input.subject}\n${input.text ?? input.html}`,
  )
}

let resendClient: Resend | undefined
function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não configurada')
  }
  resendClient ??= new Resend(env.RESEND_API_KEY)
  return resendClient
}

async function sendViaResend(input: SendEmailInput) {
  const { error } = await getResendClient().emails.send({
    from: env.EMAIL_FROM ?? 'onboarding@resend.dev',
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
  if (error) {
    throw new Error(`Falha ao enviar e-mail via Resend: ${error.message}`)
  }
}

/**
 * Envia e-mail transacional. O transport é escolhido em ordem de prioridade:
 * 1. E2E=true → grava em `.e2e/mailbox/<email>.json`, que o Playwright lê
 * 2. EMAIL_TRANSPORT=resend (exige RESEND_API_KEY) → envio de verdade
 * 3. qualquer outro caso (dev sem chave) → só loga no console
 */
export async function sendEmail(input: SendEmailInput) {
  if (env.E2E) {
    await sendViaFile(input)
    return
  }
  if (env.EMAIL_TRANSPORT === 'resend' && env.RESEND_API_KEY) {
    await sendViaResend(input)
    return
  }
  sendViaConsole(input)
}
