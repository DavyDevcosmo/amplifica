import { Skeleton } from '@/components/ui/skeleton'

// Sem isso, o clique numa rota de (public) fica "congelado" até o servidor
// responder (não há streaming visual nenhum). O Next mostra este skeleton
// na hora, enquanto a página real carrega.
export default function PublicLoading() {
  return (
    <div className="space-y-4 px-4 py-16">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  )
}
