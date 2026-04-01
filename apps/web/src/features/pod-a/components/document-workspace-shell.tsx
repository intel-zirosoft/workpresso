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
import {
  getDocumentScopeOptions,
  getDocumentStatusFilterOptions,
} from "@/features/pod-a/services/document-mobile-view";
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
  isMobileAppView: boolean;
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
  isMobileAppView,
  onNewDocument,
  onRefresh,
  onScopeChange,
  onStatusFilterChange,
  onSelectDocument,
}: DocumentWorkspaceShellProps) {
  const visibleScopeValues = getDocumentScopeOptions(isMobileAppView);
  const visibleStatusFilters = getDocumentStatusFilterOptions(isMobileAppView);
  const actionableCount = documents.filter(
    (document) => document.viewerApprovalStatus === "PENDING",
  ).length;
  const pendingCount = documents.filter(
    (document) => document.status === "PENDING",
  ).length;
  const completedCount = documents.filter(
    (document) => document.status === "APPROVED",
  ).length;
  const rejectedCount = documents.filter(
    (document) => document.status === "REJECTED",
  ).length;

  return (
    <div className="flex h-[calc(100vh-170px)] flex-col space-y-4 overflow-hidden">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-1 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-headings font-bold tracking-tight text-text">
            {isMobileAppView ? "문서 결재함" : "문서 워크스페이스"}
          </h1>
          <p className="mt-1 text-sm font-medium text-text-muted">
            {isMobileAppView
              ? "승인 대기 문서를 빠르게 검토하고 승인 또는 반려하세요."
              : "업무의 흐름을 한눈에 파악하고 결재를 진행하세요."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-pill bg-background/50 hover:bg-background h-8 px-3 text-xs"
            onClick={onRefresh}
            disabled={!currentUserId || isRefreshing}
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isRefreshing && "animate-spin")} />
            동기화
          </Button>
          {!isMobileAppView ? (
            <Button
              type="button"
              className="rounded-pill px-6 h-10 shadow-lg shadow-primary/20 transition-all hover:shadow-xl"
              onClick={onNewDocument}
              disabled={!currentUserId || isMutating}
            >
              <Plus className="mr-2 h-4 w-4" />
              새 문서 작성
            </Button>
          ) : null}
        </div>
      </header>

      {/* Status Metrics Dashboard - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1 flex-shrink-0">
        {[
          {
            label: isMobileAppView ? "내 차례" : "전체 문서",
            count: isMobileAppView ? actionableCount : documents.length,
            color: "bg-info-soft border-info/20 text-info",
            dot: "bg-info",
          },
          {
            label: "결재 대기",
            count: pendingCount,
            color: "bg-warning-soft border-warning/20 text-warning",
            dot: "bg-warning",
          },
          {
            label: "승인 완료",
            count: completedCount,
            color: "bg-success-soft border-success/20 text-success",
            dot: "bg-success",
          },
          {
            label: "반려/취소",
            count: rejectedCount,
            color: "bg-destructive-soft border-destructive/20 text-destructive",
            dot: "bg-destructive",
          },
        ].map((stat, i) => (
          <div key={i} className={cn(
            "p-3 rounded-xl border flex flex-col gap-0.5 transition-all hover:shadow-soft",
            stat.color
          )}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[18px] font-black uppercase tracking-wider opacity-60">{stat.label}</span>
              <div className={cn("w-1.5 h-1.5 rounded-full", stat.dot)} />
            </div>
            <div className="text-2xl font-headings font-bold tracking-tight">{stat.count}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="bg-surface/50 backdrop-blur-md rounded-3xl p-6 shadow-soft border border-background/50 mx-2 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-background/40 p-1.5 rounded-2xl w-fit">
              {scopeConfig
                .filter((item) => visibleScopeValues.includes(item.value))
                .sort(
                  (a, b) =>
                    visibleScopeValues.indexOf(a.value) -
                    visibleScopeValues.indexOf(b.value),
                )
                .map((item) => {
                  const isActive = scope === item.value;

                  return (
                    <button
                      key={item.value}
                      onClick={() => onScopeChange(item.value)}
                      className={cn(
                        "whitespace-nowrap rounded-xl px-5 py-2 text-[13px] font-bold transition-all",
                        isActive
                          ? "bg-surface text-primary shadow-sm"
                          : "text-text/50 hover:bg-surface/40 hover:text-text",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
            </div>
            
            <div className="flex items-center gap-1 bg-background/30 px-2 py-0.5 rounded-lg border border-background/40">
              <span className="text-[10px] font-black text-text/40 uppercase tracking-widest mr-1 ml-0.5">Status</span>
              {statusFilters
                .filter((filter) =>
                  (visibleStatusFilters as readonly StatusFilter[]).includes(
                    filter.value,
                  ),
                )
                .map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => onStatusFilterChange(filter.value)}
                    className={cn(
                      "px-2 py-0.5 text-[12px] font-bold rounded-md transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
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

        <div className="flex-1 overflow-hidden px-1 pb-4">
          {(isAuthLoading || isDocumentsLoading) ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-surface/30 rounded-[20px] border border-dashed border-background/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
              <p className="text-xs font-headings font-bold text-text/40">문서를 불러오는 중입니다...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 bg-surface/30 rounded-[20px] border border-dashed border-background/60">
              <p className="text-xs font-headings font-bold text-text/40">{authMessage || errorMessage || "현재 조건에 해당하는 문서가 없습니다."}</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1 pb-16">
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
                        "group relative flex flex-col p-4 rounded-[20px] border transition-all text-left",
                        isSelected
                          ? "bg-primary border-primary shadow-float ring-4 ring-primary/5 scale-[1.02] z-10"
                          : "bg-surface border-background/70 hover:border-primary/40 hover:bg-surface hover:shadow-soft hover:-translate-y-0.5"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                          isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/80 text-primary group-hover:bg-primary/5"
                        )}>
                          <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={cn(
                            "px-2 py-1 rounded-pill text-[9px] font-black uppercase tracking-wider shadow-sm border",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                              : badgeClassName
                          )}>
                            {badgeLabel}
                          </span>
                          {isMobileAppView &&
                          document.viewerApprovalStatus === "PENDING" ? (
                            <span
                              className={cn(
                                "rounded-pill px-2 py-1 text-[9px] font-black uppercase tracking-wider",
                                isSelected
                                  ? "bg-warning/20 text-primary-foreground"
                                  : "bg-warning-soft text-warning",
                              )}
                            >
                              지금 결재
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 mb-4">
                        <h3 className={cn(
                          "font-headings font-bold text-[15px] leading-snug mb-1.5 line-clamp-2",
                          isSelected ? "text-primary-foreground" : "text-text"
                        )}>
                          {document.title}
                        </h3>
                        <div className={cn(
                          "flex items-center gap-1.5 text-[10px] font-bold",
                          isSelected ? "text-primary-foreground/70" : "text-text/40"
                        )}>
                          <span>{renderUserName(document.author)}</span>
                          <span className="opacity-40">•</span>
                          <span>{formatDate(document.updatedAt)}</span>
                        </div>
                      </div>

                      <div className={cn(
                        "pt-3 border-t flex items-center justify-between",
                        isSelected ? "border-primary-foreground/20" : "border-background/60"
                      )}>
                        <div className={cn(
                          "text-[12px] font-black uppercase tracking-tighter opacity-80",
                          isSelected ? "text-primary-foreground" : "text-text/60"
                        )}>
                          {document.currentStepLabel || "초안 단계"}
                        </div>
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            {isMobileAppView &&
                            document.viewerApprovalStatus === "PENDING" ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/80">
                                탭하여 승인/반려
                              </span>
                            ) : null}
                            <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                              <Plus size={12} className="text-primary-foreground rotate-45" />
                            </div>
                          </div>
                        ) : null}
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
