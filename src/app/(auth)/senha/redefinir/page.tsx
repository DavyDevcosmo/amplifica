import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = { title: 'Redefinir senha — Amplifica' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Redefinir senha</CardTitle>
        <CardDescription>Escolha uma nova senha pra sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token ?? ''} />
      </CardContent>
    </Card>
  )
}
