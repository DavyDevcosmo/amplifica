#!/usr/bin/env node
// Stop hook: obriga o Claude a rodar lint + tipos + Vitest antes de encerrar
// a tarefa. Se algo falhar, sai com código 2 — o Claude não consegue parar e
// precisa corrigir antes de te entregar. Ver CLAUDE.md, seção "Validação".
//
// Node puro (não bash/PowerShell) pra funcionar igual em qualquer shell.

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const cacheFile = path.join(projectRoot, '.claude', '.verify-cache')

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf-8'))
  } catch {
    return {}
  }
}

function run(cmd) {
  try {
    execSync(cmd, { cwd: projectRoot, stdio: 'pipe', encoding: 'utf-8' })
    return { ok: true }
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n')
    return { ok: false, output: output.slice(-4000) } // cauda: o erro costuma estar no fim
  }
}

function currentDiffHash() {
  // hash do diff de tudo (staged + unstaged) + lista de arquivos untracked —
  // se nada mudou desde a última validação verde, não precisa rodar de novo
  const diff = execSync('git diff HEAD', { cwd: projectRoot, encoding: 'utf-8' })
  const untracked = execSync('git status --porcelain', {
    cwd: projectRoot,
    encoding: 'utf-8',
  })
  return createHash('sha256').update(diff).update(untracked).digest('hex')
}

function main() {
  const input = readStdin()

  // stop_hook_active = true significa que este mesmo hook já rodou nesse
  // ciclo de parada — sem essa checagem, uma falha de teste real criaria um
  // loop infinito (o Claude tenta parar, o hook bloqueia, ele tenta parar de
  // novo, o hook bloqueia nesse loop pra sempre).
  if (input.stop_hook_active) {
    process.exit(0)
  }

  let hash
  try {
    hash = currentDiffHash()
  } catch {
    // não é um repo git, ou git não disponível — não bloqueia por isso
    process.exit(0)
  }

  if (existsSync(cacheFile)) {
    const cached = readFileSync(cacheFile, 'utf-8').trim()
    if (cached === hash) {
      process.exit(0) // já validado nesse exato estado do diff
    }
  }

  const steps = [
    ['lint (biome)', 'pnpm lint'],
    ['tipos (tsc)', 'pnpm exec tsc --noEmit'],
    ['testes (vitest)', 'pnpm test'],
  ]

  for (const [label, cmd] of steps) {
    const result = run(cmd)
    if (!result.ok) {
      console.error(`❌ Validação falhou em "${label}" (${cmd}):\n\n${result.output}`)
      process.exit(2)
    }
  }

  mkdirSync(path.dirname(cacheFile), { recursive: true })
  writeFileSync(cacheFile, hash, 'utf-8')
  process.exit(0)
}

main()
