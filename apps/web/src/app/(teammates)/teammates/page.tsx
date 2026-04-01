import { StatusKanban } from "../_components/status-kanban";

export default function TeammatesPage() {
  return (
    <div className="space-y-4 flex flex-col h-[calc(90vh-100px)] overflow-hidden">
      <header className="px-2">
        <h1 className="text-2xl font-headings font-bold text-text tracking-tight">
          팀 멤버 현황
        </h1>
        <p className="text-xs text-text-muted font-headings font-medium mt-0.5">
          동료들의 현재 상태를 확인하고 소통하세요.
        </p>
      </header>

      <div className="flex-1 min-h-0 bg-surface/50 rounded-2xl p-4 border border-background/50 overflow-hidden shadow-soft mx-1">
        <StatusKanban />
      </div>
    </div>
  );
}
