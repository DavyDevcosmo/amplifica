// Metas de performance (build de produção local, contra a branch Neon "e2e").
// Ajuste aqui depois de olhar e2e/perf/baseline.json — são metas, não valores
// medidos.
export const budgets = {
  // Tempo do clique até o elemento-alvo da próxima página ficar visível.
  navigationMs: 1_000,
  // Tempo de resposta de uma server action disparada por um form (login,
  // atualizar perfil, trocar senha).
  actionMs: 1_500,
  // Largest Contentful Paint, medido no próprio browser via PerformanceObserver.
  lcpMs: 2_500,
  // Soma do encodedBodySize (comprimido) de todo <script src> carregado no
  // primeiro acesso à rota.
  jsBundleBytes: 200 * 1024,
} as const

export type BudgetKey = keyof typeof budgets
