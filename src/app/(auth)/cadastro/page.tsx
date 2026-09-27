import type { Metadata } from 'next'
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { SignUpForm } from '@/components/auth/SignUpForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldSeparator } from '@/components/ui/field'
import { googleOAuthEnabled } from '@/lib/env'

export const metadata: Metadata = { title: 'Criar conta — Amplifica' }

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Criar conta</CardTitle>
        <CardDescription>
          Pra comprar é só isso. Pra vender, você configura depois no seu painel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SignUpForm />
        {googleOAuthEnabled && (
          <>
            <FieldSeparator>ou</FieldSeparator>
            <GoogleSignInButton />
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
