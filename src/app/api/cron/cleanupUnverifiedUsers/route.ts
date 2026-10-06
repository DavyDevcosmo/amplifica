import 'server-only'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { purgeStaleThrottles } from '@/server/services/loginThrottleService'
import { purgeExpiredUnverified } from '@/server/services/pendingSignupService'

// Protegida por CRON_SECRET — só a Vercel (vercel.json) e quem tiver o
// segredo conseguem chamar. A limpeza "de verdade" dentro dos 30 min é
// preguiçosa (nos hooks do Better Auth); este cron é só uma rede de
// segurança pros cadastros abandonados que nunca voltaram pra verificar —
// e, junto, expurga os registros antigos de throttle de login.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [deletedCount, deletedThrottles] = await Promise.all([
    purgeExpiredUnverified(),
    purgeStaleThrottles(),
  ])
  return NextResponse.json({ deletedCount, deletedThrottles })
}
