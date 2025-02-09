export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded bg-gray-500 ${className}`}
            aria-hidden="true"
        />
    )
}
