import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Balance card */}
      <div className="rounded-2xl border border-amber-500/20 p-8 animate-pulse" style={{ background: "rgba(251,191,36,0.04)" }}>
        <Skeleton className="mx-auto mb-2 h-3 w-24" />
        <Skeleton className="mx-auto h-14 w-48 rounded-xl" />
        <div className="mt-4 flex justify-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 mb-3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
