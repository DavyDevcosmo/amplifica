import { Skeleton } from '@/components/ui/skeleton'

// (auth)/layout.tsx já desenha o cabeçalho e o painel lateral — este skeleton só
// ocupa o espaço do título e dos campos enquanto a página real carrega.
export default function AuthLoading() {
  return (
    <div className="flex flex-col gap-(--auth-section-gap)" aria-hidden>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex flex-col gap-(--auth-gap)">
        <Skeleton className="h-(--auth-control-h) w-full" />
        <Skeleton className="h-(--auth-control-h) w-full" />
        <Skeleton className="h-(--auth-control-h) w-full" />
      </div>
    </div>
  )
}
