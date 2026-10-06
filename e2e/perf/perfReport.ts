import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Cada spec de perf chama recordMetric() depois de medir. Todas as specs
// rodam com `workers: 1` (ver playwright.perf.config.ts), então não há
// escrita concorrente no mesmo arquivo.
//
// Fica fora de `test-results/` de propósito: o Playwright limpa essa pasta
// no início de toda execução (mesmo rodando só um arquivo/teste filtrado
// com `-g`), o que apagaria as métricas dos outros specs a cada rodada
// parcial.
const OUT_DIR = path.join(process.cwd(), '.perf-results')
const LATEST_PATH = path.join(OUT_DIR, 'latest.json')
export const BASELINE_PATH = path.join(process.cwd(), 'e2e', 'perf', 'baseline.json')

export type PerfMetric = {
  name: string
  valueMs?: number
  valueBytes?: number
  budget: number
  unit: 'ms' | 'bytes'
}

async function readJsonIfExists<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(filePath, 'utf-8')) as T
  } catch {
    return undefined
  }
}

export async function recordMetric(metric: PerfMetric) {
  await mkdir(OUT_DIR, { recursive: true })
  const current = (await readJsonIfExists<PerfMetric[]>(LATEST_PATH)) ?? []
  const withoutSameName = current.filter((m) => m.name !== metric.name)
  await writeFile(
    LATEST_PATH,
    JSON.stringify([...withoutSameName, metric], null, 2),
    'utf-8',
  )
}

export async function readBaseline(): Promise<Record<string, number> | undefined> {
  const baseline = await readJsonIfExists<PerfMetric[]>(BASELINE_PATH)
  if (!baseline) return undefined
  return Object.fromEntries(
    baseline.map((m) => [m.name, m.valueMs ?? m.valueBytes ?? 0]),
  )
}
