import { Skeleton } from "@/components/ui/skeleton"

export const OrderDetailSkeleton = () => {
  return (
    <div className="relative p-4 space-y-6">
      {/* soft background like the page */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* heading */}
      <Skeleton className="h-9 w-[320px] rounded-2xl bg-white/70" />

      {/* main card skeleton */}
      <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* left: customer + products */}
          <div>
            <Skeleton className="mb-2 h-6 w-48 rounded-xl bg-white/80" />
            <Skeleton className="mb-1 h-4 w-80 rounded-xl bg-white/70" />
            <Skeleton className="mb-1 h-4 w-64 rounded-xl bg-white/70" />
            <Skeleton className="mb-3 h-4 w-44 rounded-xl bg-white/70" />

            <Skeleton className="mb-2 h-4 w-40 rounded-xl bg-white/80" />
            <div className="rounded-2xl border border-white/40 bg-white/70 p-3">
              <Skeleton className="mb-2 h-4 w-4/5 rounded-xl bg-white/80" />
              <Skeleton className="mb-2 h-4 w-3/5 rounded-xl bg-white/80" />
              <Skeleton className="h-4 w-2/5 rounded-xl bg-white/80" />
            </div>
          </div>

          {/* right: quantities list + status */}
          <div>
            {/* quantities block */}
            <Skeleton className="mb-2 h-4 w-36 rounded-xl bg-white/80" />
            <div className="rounded-2xl border border-white/40 bg-white/70 p-3">
              {[0,1].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/40 py-2 last:border-none">
                  <Skeleton className="h-4 w-2/3 rounded-xl bg-white/80" />
                  <Skeleton className="h-8 w-20 rounded-xl bg-white/80" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-3 h-10 w-40 rounded-xl bg-white/80" />

            {/* status dropdown */}
            <Skeleton className="mt-6 mb-2 h-4 w-32 rounded-xl bg-white/80" />
            <Skeleton className="h-10 w-full rounded-xl bg-white/80" />
          </div>
        </div>
      </div>

      {/* timeline skeleton */}
      <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <Skeleton className="mb-4 h-4 w-40 rounded-xl bg-white/80" />

        <div className="space-y-5">
          {[0,1,2,3].map((i) => (
            <div key={i} className="grid grid-cols-[28px_1fr] gap-3">
              {/* left rail + dot */}
              <div className="relative">
                <div className="pointer-events-none absolute left-[13px] top-0 bottom-0 w-px bg-gradient-to-b from-zinc-300 via-zinc-200 to-transparent" />
                <div className="mx-auto mt-[22px] h-3 w-3 rounded-full ring-4 ring-zinc-200 bg-zinc-400" />
              </div>

              {/* right card */}
              <div className="rounded-xl border border-white/50 bg-white/90 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-4 w-32 rounded-xl bg-white/80" />
                  <Skeleton className="h-4 w-20 rounded-2xl bg-white/80" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded-xl bg-white/80" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
