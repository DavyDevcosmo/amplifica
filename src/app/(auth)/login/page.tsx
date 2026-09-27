import type { Metadata } from 'next'
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { SignInForm } from '@/components/auth/SignInForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldSeparator } from '@/components/ui/field'
import { googleOAuthEnabled } from '@/lib/env'

export const metadata: Metadata = { title: 'Entrar — Amplifica' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta pra comprar ou vender presets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SignInForm callbackUrl={callbackUrl} />
        {googleOAuthEnabled && (
          <>
            <FieldSeparator>ou</FieldSeparator>
            <GoogleSignInButton callbackUrl={callbackUrl} />
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link
            href="/cadastro"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
