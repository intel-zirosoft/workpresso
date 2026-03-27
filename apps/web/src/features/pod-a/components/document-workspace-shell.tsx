"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";

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
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-md bg-surface px-8 py-7 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-headings font-semibold tracking-tight text-text">
            문서 탐색에 집중하고, 상세와 편집은 더 넓게 보세요.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-text/80">
            목록은 가볍게 훑고, 문서를 열 때는 읽기 전용 상세 모달과 대형 편집
            오버레이로 전환되는 하이브리드 워크플로우입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="rounded-pill px-5"
            onClick={onNewDocument}
            disabled={!currentUserId || isMutating}
          >
            <Plus className="h-4 w-4" />새 문서
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-pill"
            onClick={onRefresh}
            disabled={!currentUserId || isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            새로고침
          </Button>
        </div>
      </section>

      <Card className="rounded-md border-none bg-surface shadow-soft">
        <CardHeader className="space-y-4 border-b border-background/70 bg-background/35">
          <div>
            <CardTitle className="text-2xl font-headings text-text">
              문서 탐색
            </CardTitle>
            <CardDescription className="font-body text-text/70">
              scope와 상태를 기준으로 문서를 추려 보고, 항목을 클릭하면 상세
              모달에서 빠르게 확인합니다.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {scopeConfig.map((item) => {
              const isActive = scope === item.value;

              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  className="rounded-pill"
                  onClick={() => onScopeChange(item.value)}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  className="rounded-pill"
                  onClick={() => onStatusFilterChange(filter.value)}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {isAuthLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              사용자 정보를 확인하고 있습니다.
            </div>
          ) : null}

          {authMessage ? (
            <p className="rounded-md bg-secondary/20 px-4 py-3 text-sm text-text">
              {authMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {!isAuthLoading && isDocumentsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              문서를 불러오는 중입니다.
            </div>
          ) : null}

          {!isDocumentsLoading &&
          !isDocumentsError &&
          documents.length === 0 ? (
            <div className="rounded-md bg-background/60 px-5 py-8 text-center text-sm leading-6 text-text/60">
              현재 조건에 해당하는 문서가 없습니다.
            </div>
          ) : null}

          {scope === "authored" ? (
            <div className="hidden overflow-hidden rounded-md border border-background/70 md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background/60 text-left text-text/70">
                    <th className="px-4 py-3">제목</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">현재 단계</th>
                    <th className="px-4 py-3">수정일</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => {
                    const isSelected = selectedDocumentId === document.id;

                    return (
                      <tr
                        key={document.id}
                        className={cn(
                          "cursor-pointer border-t border-background/70 transition-colors hover:bg-background/60",
                          isSelected && "bg-primary/10",
                        )}
                        onClick={() => onSelectDocument(document.id)}
                      >
                        <td className="px-4 py-3 font-medium text-text">
                          {document.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-pill px-3 py-1 text-xs font-semibold",
                              statusBadgeClassMap[document.status],
                            )}
                          >
                            {statusLabelMap[document.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text/70">
                          {document.currentStepLabel ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-text/60">
                          {formatDate(document.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="space-y-3 md:hidden">
            {documents.map((document) => {
              const isSelected = selectedDocumentId === document.id;

              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => onSelectDocument(document.id)}
                  className={cn(
                    "w-full rounded-md px-4 py-4 text-left transition-all",
                    isSelected
                      ? "bg-primary text-white shadow-soft"
                      : "bg-background/70 text-text hover:bg-background",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-headings text-base font-semibold">
                        {document.title}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isSelected ? "text-white/80" : "text-text/60",
                        )}
                      >
                        {document.currentStepLabel ??
                          statusLabelMap[document.status]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-pill px-3 py-1 text-xs font-semibold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : statusBadgeClassMap[document.status],
                      )}
                    >
                      {statusLabelMap[document.status]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {scope !== "authored" ? (
            <div className="space-y-3">
              {documents.map((document) => {
                const isSelected = selectedDocumentId === document.id;

                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => onSelectDocument(document.id)}
                    className={cn(
                      "hidden w-full rounded-md px-4 py-4 text-left transition-all md:block",
                      isSelected
                        ? "bg-primary text-white shadow-soft"
                        : "bg-background/70 text-text hover:bg-background",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <p className="truncate font-headings text-base font-semibold">
                          {document.title}
                        </p>
                        <div
                          className={cn(
                            "text-sm",
                            isSelected ? "text-white/80" : "text-text/60",
                          )}
                        >
                          작성자 {renderUserName(document.author)}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            isSelected ? "text-white/75" : "text-text/55",
                          )}
                        >
                          {document.currentStepLabel
                            ? `${document.currentStepLabel} · ${renderUserName(document.currentApprover)}`
                            : "현재 활성 단계 없음"}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-pill px-3 py-1 text-xs font-semibold",
                          isSelected
                            ? "bg-white/20 text-white"
                            : statusBadgeClassMap[document.status],
                        )}
                      >
                        {statusLabelMap[document.status]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
