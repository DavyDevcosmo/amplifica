import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // "server-only" só funciona sob a condition "react-server" do Next —
      // fora dela lança de propósito. Trocamos por um módulo vazio pra
      // conseguir testar funções de arquivos marcados server-only.
      'server-only': fileURLToPath(
        new URL('./vitest.stubs/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // `exclude` sobrescreve (não soma) o default do Vitest, que já bloqueia
    // node_modules em qualquer profundidade — por isso o padrão precisa do
    // `**/` na frente, senão um `node_modules` aninhado (ex.: dentro de um
    // worktree do git em .claude/worktrees/) escapa do filtro e o Vitest
    // acaba rodando os testes internos das próprias dependências.
    exclude: ['e2e/**', '**/node_modules/**', '.claude/worktrees/**'],
  },
})
