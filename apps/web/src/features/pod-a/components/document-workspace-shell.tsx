"use client";

import { FileText, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type DocumentScope,
  type DocumentSummary,
} from "@/features/pod-a/services/document-schema";
import {
  approvalStepStatusBadgeClassMap,
  approvalStepStatusLabelMap,
  formatDate,
  renderUserName,
  scopeConfig,
  statusBadgeClassMap,
  statusFilters,
  statusLabelMap,
  type StatusFilter,
} from "@/features/pod-a/components/document-workspace-shared";

type DocumentWorkspaceShellProps = {
  currentUserId: string;
  isMutating: boolean;
  isAuthLoading: boolean;
  authMessage: string;
  errorMessage: string | null;
  scope: DocumentScope;
  statusFilter: StatusFilter;
  documents: DocumentSummary[];
  isDocumentsLoading: boolean;
  isDocumentsError: boolean;
  isRefreshing: boolean;
  selectedDocumentId: string | null;
  onNewDocument: () => void;
  onRefresh: () => void;
  onScopeChange: (scope: DocumentScope) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onSelectDocument: (documentId: string) => void;
};

export function DocumentWorkspaceShell({
  currentUserId,
  isMutating,
  isAuthLoading,
  authMessage,
  errorMessage,
  scope,
  statusFilter,
  documents,
  isDocumentsLoading,
  isDocumentsError,
  isRefreshing,
  selectedDocumentId,
  onNewDocument,
  onRefresh,
  onScopeChange,
  onStatusFilterChange,
  onSelectDocument,
}: DocumentWorkspaceShellProps) {
  return (
    <div className="space-y-6 flex flex-col h-screen max-h-[calc(100vh-8rem)]">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-2 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-headings font-bold tracking-tight text-text">문서 워크스페이스</h1>
          <p className="text-sm text-text-muted font-medium mt-1">업무의 흐름을 한눈에 파악하고 결재를 진행하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-pill bg-background/50 hover:bg-background h-10 px-4"
            onClick={onRefresh}
            disabled={!currentUserId || isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            동기화
          </Button>
          <Button
            type="button"
            className="rounded-pill px-6 h-10 shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            onClick={onNewDocument}
            disabled={!currentUserId || isMutating}
          >
            <Plus className="h-4 w-4 mr-2" />새 문서 작성
          </Button>
        </div>
      </header>

      {/* Status Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2 flex-shrink-0">
        {[
          { label: "전체 문서", count: documents.length, color: "bg-blue-50/80 border-blue-200/50 text-blue-600", dot: "bg-blue-400" },
          { label: "결재 대기", count: documents.filter(d => d.status === 'PENDING').length, color: "bg-amber-50/80 border-amber-200/50 text-amber-600", dot: "bg-amber-400" },
          { label: "승인 완료", count: documents.filter(d => d.status === 'APPROVED').length, color: "bg-emerald-50/80 border-emerald-200/50 text-emerald-600", dot: "bg-emerald-400" },
          { label: "반려/취소", count: documents.filter(d => d.status === 'REJECTED').length, color: "bg-rose-50/80 border-rose-200/50 text-rose-600", dot: "bg-rose-400" },
        ].map((stat, i) => (
          <div key={i} className={cn(
            "p-5 rounded-2xl border flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-0.5",
            stat.color
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-black uppercase tracking-wider opacity-60">{stat.label}</span>
              <div className={cn("w-2 h-2 rounded-full", stat.dot)} />
            </div>
            <div className="text-4xl font-headings font-bold tracking-tight">{stat.count}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="bg-surface/50 backdrop-blur-md rounded-3xl p-6 shadow-soft border border-background/50 mx-2 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-background/40 p-1.5 rounded-2xl w-fit">
              {scopeConfig.map((item) => {
                const isActive = scope === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => onScopeChange(item.value)}
                    className={cn(
                      "px-5 py-2 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap",
                      isActive
                        ? "bg-surface text-primary shadow-sm"
                        : "text-text/50 hover:text-text hover:bg-surface/40"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1.5 rounded-xl border border-background/40">
              <span className="text-[11px] font-black text-text/40 uppercase tracking-widest mr-2 ml-1">Status</span>
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => onStatusFilterChange(filter.value)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                      isActive 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-text/60 hover:bg-background/50 hover:text-text"
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-2 pb-6">
          {(isAuthLoading || isDocumentsLoading) ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 bg-surface/30 rounded-3xl border border-dashed border-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              <p className="text-sm font-headings font-bold text-text/40">문서를 불러오는 중입니다...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 bg-surface/30 rounded-3xl border border-dashed border-background/60">
              <p className="text-sm font-headings font-bold text-text/40">{authMessage || errorMessage || "현재 조건에 해당하는 문서가 없습니다."}</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1 pb-20">
                {documents.map((document) => {
                  const isSelected = selectedDocumentId === document.id;
                  const badgeLabel =
                    scope === "approvals" && document.viewerApprovalStatus
                      ? approvalStepStatusLabelMap[document.viewerApprovalStatus]
                      : statusLabelMap[document.status];
                  const badgeClassName =
                    scope === "approvals" && document.viewerApprovalStatus
                      ? approvalStepStatusBadgeClassMap[
                          document.viewerApprovalStatus
                        ]
                      : statusBadgeClassMap[document.status] ||
                        "bg-background/80 text-text/60 border-background";

                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => onSelectDocument(document.id)}
                      className={cn(
                        "group relative flex flex-col p-6 rounded-3xl border transition-all text-left",
                        isSelected
                          ? "bg-primary border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/5 scale-[1.02] z-10"
                          : "bg-surface border-background/70 hover:border-primary/40 hover:bg-surface hover:shadow-md hover:-translate-y-1"
                      )}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                          isSelected ? "bg-white/20 text-white" : "bg-background/80 text-primary group-hover:bg-primary/5"
                        )}>
                          <FileText size={22} strokeWidth={2.5} />
                        </div>
                        <span className={cn(
                          "px-3 py-1.5 rounded-pill text-[10px] font-black uppercase tracking-wider shadow-sm border",
                          isSelected 
                            ? "bg-white/20 text-white border-white/20" 
                            : badgeClassName
                        )}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 mb-6">
                        <h3 className={cn(
                          "font-headings font-bold text-lg leading-tight mb-2 line-clamp-2",
                          isSelected ? "text-white" : "text-text"
                        )}>
                          {document.title}
                        </h3>
                        <div className={cn(
                          "flex items-center gap-2 text-[11px] font-bold",
                          isSelected ? "text-white/70" : "text-text/40"
                        )}>
                          <span>{renderUserName(document.author)}</span>
                          <span className="opacity-40">•</span>
                          <span>{formatDate(document.updatedAt)}</span>
                        </div>
                      </div>

                      <div className={cn(
                        "pt-4 border-t flex items-center justify-between",
                        isSelected ? "border-white/20" : "border-background/60"
                      )}>
                        <div className={cn(
                          "text-[10px] font-black uppercase tracking-tighter opacity-80",
                          isSelected ? "text-white" : "text-text/60"
                        )}>
                          {document.currentStepLabel || "초안 단계"}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus size={14} className="text-white rotate-45" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
