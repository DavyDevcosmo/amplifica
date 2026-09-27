import type { Metadata } from 'next'
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = { title: 'Confirme seu e-mail — Amplifica' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confirme seu e-mail</CardTitle>
        <CardDescription>Digite o código de 6 dígitos que enviamos.</CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyEmailForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  )
}
