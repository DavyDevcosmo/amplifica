import type { auth } from '@/lib/auth'

// Augment de tipo pra ter `role`/`status` tipados em toda leitura de sessão
// (getSession/requireUser), sem precisar importar `auth` só pra isso.
export type Session = typeof auth.$Infer.Session
export type SessionUser = Session['user']
