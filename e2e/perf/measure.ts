export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Roda `fn` `repeats` vezes e devolve a mediana da duração em ms. A mediana
 * (em vez da média) evita que um único cold-start puxe o número pra cima —
 * é a experiência "típica" que interessa aqui, não o pior caso.
 *
 * `between`, se passado, roda depois de cada `fn` (ex.: desloga pra deixar
 * o próximo `fn` repetir o mesmo cenário de login) e **não entra na
 * medição** — só o tempo de `fn` conta pro resultado.
 */
export async function measureMedian(
  fn: () => Promise<void>,
  repeats = 3,
  between?: () => Promise<void>,
): Promise<number> {
  const durations: number[] = []
  for (let i = 0; i < repeats; i++) {
    const start = Date.now()
    await fn()
    durations.push(Date.now() - start)
    if (between) await between()
  }
  return median(durations)
}
