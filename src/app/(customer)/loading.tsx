import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerLoading() {
  return (
    <div className="mx-auto w-full max-w-280 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-2 pb-7">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="flex gap-2 md:w-60 md:flex-col">
          <Skeleton className="h-12 flex-1 rounded-[0.625rem]" />
          <Skeleton className="h-12 flex-1 rounded-[0.625rem]" />
        </div>
        <Skeleton className="h-96 flex-1 rounded-2xl" />
      </div>
    </div>
  )
}
