interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6 animate-pulse">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
