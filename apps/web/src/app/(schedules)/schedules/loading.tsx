export default function SchedulesLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-5 w-64 animate-pulse rounded-lg bg-muted/30" />
      </header>

      <div className="rounded-2xl border border-background/50 bg-surface p-8 shadow-soft">
        <div className="flex h-[calc(100vh-14rem)] min-h-[600px] items-center justify-center rounded-2xl border border-dashed border-background/60 bg-background/30">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium text-text-muted">일정 화면을 불러오는 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
