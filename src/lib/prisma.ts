import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import { PrismaClient } from '@/generated/prisma/client'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}
const adapter = new PrismaNeon({ connectionString: databaseUrl })

const debugDbTiming = process.env.DEBUG_DB_TIMING === '1'
const dbTimingLogPath = path.join(process.cwd(), '.perf-results', 'db-timing.log')

function createPrismaClient() {
  if (!debugDbTiming) {
    return new PrismaClient({ adapter })
  }
  const client = new PrismaClient({ adapter, log: [{ emit: 'event', level: 'query' }] })
  mkdirSync(path.dirname(dbTimingLogPath), { recursive: true })
  client.$on('query', (event) => {
    const line = `[db ${event.duration}ms] ${event.query}\n`
    console.log(line.trimEnd())
    appendFileSync(dbTimingLogPath, line)
  })
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
