import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

const DashboardSkeleton = () => {
    return (
        <div className="space-y-6 p-5">
            {/* ✅ Page Heading */}
            <Skeleton className="h-10 w-1/3 rounded-md" />

            {/* ✅ Stats Section */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card
                        key={index}
                        className="relative p-5 bg-gray-100 shadow-md rounded-[6px] rounded-b-none rounded-t-2xl border border-gray-300"
                    >
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-1.5">
                                    {/* ✅ Skeleton for Icon */}
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-md" />
                                </div>
                            </div>
                            {/* ✅ Skeleton for Number */}
                            <Skeleton className="h-10 w-16 rounded-md" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* ✅ Graphs Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* ✅ Bar Chart Skeleton */}
                <Card className="p-4">
                    <Skeleton className="h-6 w-1/4 mb-3 rounded-md" />
                    <Skeleton className="h-64 w-full rounded-md" />
                </Card>

                {/* ✅ Line Chart Skeleton */}
                <Card className="p-4">
                    <Skeleton className="h-6 w-1/4 mb-3 rounded-md" />
                    <Skeleton className="h-64 w-full rounded-md" />
                </Card>
            </div>
        </div>
    )
}

export default DashboardSkeleton
