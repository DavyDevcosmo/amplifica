import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

// Next 16 renomeou middleware.ts pra proxy.ts. Isso aqui é só um redirect
// OTIMISTA baseado na presença do cookie de sessão — não é segurança de
// verdade (o cookie pode estar expirado/inválido). O guard que importa é o
// `requireUser()`/`requireRole()` do src/lib/auth.ts, chamado nos layouts.
const PROTECTED_PREFIXES = ['/carrinho', '/checkout', '/conta', '/vendedor', '/admin']
const AUTH_PAGES = ['/login', '/cadastro']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSessionCookie = Boolean(getSessionCookie(request))

  if (!hasSessionCookie && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`)
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url),
    )
  }

  if (hasSessionCookie && matchesPrefix(pathname, AUTH_PAGES)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/carrinho/:path*',
    '/checkout/:path*',
    '/conta/:path*',
    '/vendedor/:path*',
    '/admin/:path*',
    '/login',
    '/cadastro',
  ],
}
