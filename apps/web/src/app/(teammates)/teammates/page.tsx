import { StatusKanban } from "../_components/status-kanban";

export default function TeammatesPage() {
  return (
    <div className="space-y-4 flex flex-col h-[calc(90vh-100px)] overflow-hidden">
      <div className="flex-1 min-h-0 bg-surface/50 rounded-2xl p-4 border border-background/50 overflow-hidden shadow-soft mx-1 mt-2">
        <StatusKanban />
      </div>
    </div>
  );
}
