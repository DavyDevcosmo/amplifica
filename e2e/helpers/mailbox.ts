import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'

// Espelha src/lib/email.ts (transport "file") — o app grava aqui quando
// E2E=true, e os testes leem daqui em vez de uma caixa de e-mail real.
const MAILBOX_DIR = path.join(process.cwd(), '.e2e', 'mailbox')

function mailboxFileFor(to: string) {
  const safe = to.replace(/[^a-zA-Z0-9@._-]/g, '_')
  return path.join(MAILBOX_DIR, `${safe}.json`)
}

type MailboxEmail = {
  to: string
  subject: string
  html: string
  text?: string
  sentAt: string
}

/**
 * Espera o e-mail chegar na caixa fake (o app grava de forma assíncrona via
 * `after()`) e devolve o conteúdo. Faz polling porque não há como "esperar"
 * um evento de escrita em arquivo de outro processo.
 */
async function waitForEmail(to: string, timeoutMs = 10_000): Promise<MailboxEmail> {
  const file = mailboxFileFor(to)
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const raw = await readFile(file, 'utf-8')
      return JSON.parse(raw) as MailboxEmail
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  throw new Error(`Nenhum e-mail chegou pra ${to} em ${timeoutMs}ms (arquivo: ${file})`)
}

export async function waitForOtp(to: string): Promise<string> {
  const email = await waitForEmail(to)
  const match = (email.text ?? email.html).match(/\b(\d{6})\b/)
  if (!match) throw new Error(`Não achei um código de 6 dígitos no e-mail pra ${to}`)
  return match[1]
}

export async function clearMailbox() {
  await rm(MAILBOX_DIR, { recursive: true, force: true })
}
