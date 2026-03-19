export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-violet-500/30 border-t-yellow-400" />
      </div>
      <p className="text-sm text-[var(--text-muted)]">Loading...</p>
    </div>
  );
}
