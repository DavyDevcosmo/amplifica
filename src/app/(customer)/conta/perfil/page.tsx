import type { Metadata } from 'next'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { ProfileForm } from '@/components/account/ProfileForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { hasCredentialAccount } from '@/server/queries/userQueries'

export const metadata: Metadata = { title: 'Meu perfil — Amplifica' }

export default async function ProfilePage() {
  const user = await requireUser('/conta/perfil')
  const canChangePassword = await hasCredentialAccount(user.id)

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl font-medium">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Seus dados de conta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto e nome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload user={{ name: user.name, image: user.image }} />
          <ProfileForm name={user.name} />
        </CardContent>
      </Card>

      {canChangePassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Senha</CardTitle>
            <CardDescription>
              Ao trocar, suas outras sessões são desconectadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
