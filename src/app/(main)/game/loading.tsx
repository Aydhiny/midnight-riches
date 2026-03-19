import { Skeleton } from "@/components/ui/skeleton";

export default function GameLoading() {
  return (
    <div className="flex flex-col items-center gap-4 p-4 pt-8 w-full max-w-lg mx-auto">
      {/* Game selector skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Cabinet skeleton */}
      <div
        className="w-full rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* LED strip top */}
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Reels area */}
        <div className="mx-4 mb-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="m-1.5 rounded-xl"
                  style={{ height: 108, background: "rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* LED strip bottom */}
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Control panel skeleton */}
      <div className="w-full rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
