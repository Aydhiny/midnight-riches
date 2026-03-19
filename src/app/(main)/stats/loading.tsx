import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 space-y-3 animate-pulse"
          >
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 space-y-4 animate-pulse"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
