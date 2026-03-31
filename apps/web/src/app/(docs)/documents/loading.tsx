export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-5 w-72 animate-pulse rounded-lg bg-muted/30" />
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-background/50 bg-surface/70"
          />
        ))}
      </div>

      <div className="rounded-3xl border border-background/50 bg-surface/70 p-6 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-3xl border border-background/40 bg-background/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
