export default function ChatterLoading() {
  return (
    <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-[28px] border border-background/50 bg-surface p-5 shadow-soft">
        <div className="h-8 w-32 animate-pulse rounded-xl bg-muted/40" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-background/40 bg-background/30"
            />
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-background/50 bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-4 w-56 animate-pulse rounded-lg bg-muted/30" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-pill bg-muted/30" />
        </div>

        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[24px] border border-background/40 bg-background/30"
            />
          ))}
        </div>

        <div className="mt-6 h-14 animate-pulse rounded-[20px] border border-background/40 bg-background/30" />
      </div>
    </div>
  );
}
