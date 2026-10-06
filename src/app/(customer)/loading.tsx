import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
