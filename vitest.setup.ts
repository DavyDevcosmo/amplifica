import 'dotenv/config'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL não desmonta sozinho entre testes sem `test.globals` — sem isso, cada
// teste no mesmo arquivo acumula o DOM do anterior.
afterEach(() => {
  cleanup()
})

// jsdom não implementa elementFromPoint; o input-otp usa isso pra detectar
// gerenciador de senha do navegador (só relevante em browser de verdade).
if (typeof document !== 'undefined' && !document.elementFromPoint) {
  document.elementFromPoint = () => null
}
