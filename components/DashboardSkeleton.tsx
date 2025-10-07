import { Skeleton } from '@/components/ui/skeleton'

const GlassShell = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
    {children}
  </div>
)

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GlassShell key={i}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </GlassShell>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassShell>
          <Skeleton className="mb-3 h-5 w-48 rounded-md" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </GlassShell>
        <GlassShell>
          <Skeleton className="mb-3 h-5 w-44 rounded-md" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </GlassShell>
      </div>

    </div>
  )
}

export default DashboardSkeleton
