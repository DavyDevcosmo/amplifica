import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// prisma.ts roda código de módulo (lança se faltar DATABASE_URL, instancia o
// client) assim que é importado — por isso cada teste reseta os módulos e
// reimporta dinamicamente, em vez de um único `import` no topo do arquivo.

const neonConfigStub: { webSocketConstructor: unknown } = {
  webSocketConstructor: undefined,
}

class FakePrismaNeon {
  connectionString: string
  constructor(opts: { connectionString: string }) {
    this.connectionString = opts.connectionString
  }
}

class FakePrismaClient {
  static instances: FakePrismaClient[] = []
  opts: unknown
  handlers: Record<string, (event: unknown) => void> = {}
  constructor(opts: unknown) {
    this.opts = opts
    FakePrismaClient.instances.push(this)
  }
  $on(event: string, handler: (e: unknown) => void) {
    this.handlers[event] = handler
  }
}

vi.mock('@neondatabase/serverless', () => ({ neonConfig: neonConfigStub }))
vi.mock('@prisma/adapter-neon', () => ({ PrismaNeon: FakePrismaNeon }))
vi.mock('ws', () => ({ default: class FakeWs {} }))
vi.mock('@/generated/prisma/client', () => ({ PrismaClient: FakePrismaClient }))

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  FakePrismaClient.instances = []
  process.env = { ...ORIGINAL_ENV, DATABASE_URL: 'postgresql://user:pass@host/db' }
  // prisma.ts guarda o client em globalThis (sobrevive a `vi.resetModules()`,
  // que só limpa o cache de módulos) — sem isso, a partir do 2º teste
  // `globalForPrisma.prisma` já está preenchido e `createPrismaClient()`
  // nunca roda de novo.
  ;(globalThis as unknown as { prisma?: unknown }).prisma = undefined
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('createPrismaClient (DEBUG_DB_TIMING)', () => {
  test('lança se DATABASE_URL não estiver definida', async () => {
    process.env.DATABASE_URL = undefined
    await expect(import('./prisma')).rejects.toThrow('DATABASE_URL is not set')
  })

  test('sem DEBUG_DB_TIMING: instancia PrismaClient só com o adapter, sem log', async () => {
    delete process.env.DEBUG_DB_TIMING
    const { prisma } = await import('./prisma')

    expect(FakePrismaClient.instances).toHaveLength(1)
    const instance = FakePrismaClient.instances[0] as unknown as FakePrismaClient
    expect(instance.opts).toEqual({ adapter: expect.any(FakePrismaNeon) })
    expect(prisma).toBe(instance)
  })

  test('DEBUG_DB_TIMING=1: instancia com log de query e registra listener', async () => {
    process.env.DEBUG_DB_TIMING = '1'
    await import('./prisma')

    const instance = FakePrismaClient.instances[0] as unknown as FakePrismaClient
    expect(instance.opts).toMatchObject({
      log: [{ emit: 'event', level: 'query' }],
    })
    expect(instance.handlers.query).toBeTypeOf('function')
  })

  test('DEBUG_DB_TIMING=1: o listener loga duração e texto da query', async () => {
    process.env.DEBUG_DB_TIMING = '1'
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await import('./prisma')

    const instance = FakePrismaClient.instances[0] as unknown as FakePrismaClient
    instance.handlers.query({ duration: 42, query: 'SELECT 1' })

    expect(logSpy).toHaveBeenCalledWith('[db 42ms] SELECT 1')
  })

  test('DEBUG_DB_TIMING com valor diferente de "1" mantém comportamento sem log', async () => {
    process.env.DEBUG_DB_TIMING = 'true'
    await import('./prisma')

    const instance = FakePrismaClient.instances[0] as unknown as FakePrismaClient
    expect(instance.opts).toEqual({ adapter: expect.any(FakePrismaNeon) })
  })
})
