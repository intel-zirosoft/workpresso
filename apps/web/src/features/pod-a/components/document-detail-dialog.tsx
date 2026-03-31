"use client";

import {
  CheckCheck,
  FileText,
  GitBranch,
  Loader2,
  PencilLine,
  Send,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type DocumentDetail } from "@/features/pod-a/services/document-schema";
import {
  formatDate,
  renderUserName,
  statusBadgeClassMap,
  statusLabelMap,
} from "@/features/pod-a/components/document-workspace-shared";

const approvalStepStatusLabelMap = {
  WAITING: "대기",
  PENDING: "진행 중",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

const approvalStepStatusClassMap = {
  WAITING: "bg-background text-text-muted",
  PENDING: "bg-warning-soft text-warning",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-destructive-soft text-destructive",
} as const;

type DocumentDetailDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
  onEdit: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  submitPending: boolean;
  approvalPending: boolean;
  deletePending: boolean;
};

export function DocumentDetailDialog({
  isOpen,
  onOpenChange,
  document,
  isLoading,
  errorMessage,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
  submitPending,
  approvalPending,
  deletePending,
}: DocumentDetailDialogProps) {
  const isActionPending = submitPending || approvalPending || deletePending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-7xl flex-row gap-0 overflow-hidden border-none bg-surface p-0 shadow-2xl sm:h-[95vh]">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-background/60 bg-background/60 p-8">
          <div className="mb-10">
            <h2 className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              Detail
            </h2>
            <p className="text-[13px] font-medium tracking-tight text-text-muted">
              Document Overview
            </p>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-background/60 bg-surface p-5 shadow-sm">
              <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                상태
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                  document
                    ? statusBadgeClassMap[document.status]
                    : "bg-background text-text-muted",
                )}
              >
                {document ? statusLabelMap[document.status] : "로딩 중"}
              </span>

              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-text/30">
                    작성자
                  </div>
                  <div className="mt-1 font-medium text-text">
                    {renderUserName(document?.author)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-text/30">
                    최종 수정
                  </div>
                  <div className="mt-1 font-medium text-text">
                    {formatDate(document?.updatedAt ?? null)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-text/30">
                    제출 시각
                  </div>
                  <div className="mt-1 font-medium text-text">
                    {formatDate(document?.submittedAt ?? null)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-text/30">
                    현재 단계
                  </div>
                  <div className="mt-1 font-medium text-text">
                    {document?.currentStepLabel ?? "없음"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-background/60 bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
                <GitBranch className="h-4 w-4 text-primary" />
                결재선
              </div>
              <div className="space-y-3">
                {document?.approvalSteps.length ? (
                  document.approvalSteps.map((step) => (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-background/60 bg-background/70 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-text">
                            {step.stepOrder}. {step.stepLabel}
                          </div>
                          <div className="mt-1 text-xs text-text-muted">
                            {renderUserName(step.approver)}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-bold",
                            approvalStepStatusClassMap[step.status],
                          )}
                        >
                          {approvalStepStatusLabelMap[step.status]}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-text-muted">
                        처리 시각 {formatDate(step.actedAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-background bg-background/60 px-4 py-5 text-sm text-text-muted">
                    등록된 결재선이 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-background/60 bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
                <UserPlus className="h-4 w-4 text-primary" />
                공람 대상
              </div>
              <div className="flex flex-wrap gap-2">
                {document?.ccRecipients.length ? (
                  document.ccRecipients.map((recipient) => (
                    <span
                      key={recipient.id}
                      className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {renderUserName(recipient.recipient)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-text-muted">공람자 없음</span>
                )}
              </div>
            </section>
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col bg-surface">
          {errorMessage ? (
            <div className="border-b border-destructive/20 bg-destructive-soft px-8 py-3 text-sm font-medium text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-24 pt-16">
            {isLoading ? (
              <div className="flex min-h-full items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                문서 상세를 불러오는 중입니다.
              </div>
            ) : null}

            {!isLoading && document ? (
              <div className="mx-auto max-w-5xl">
                <header className="mb-12">
                  <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary shadow-sm ring-1 ring-primary/5">
                    DETAIL VIEW
                  </div>
                  <h1 className="mb-3 text-4xl font-black tracking-tight text-text">
                    {document.title}
                  </h1>
                  <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-text-muted">
                    작성 화면과 동일한 정보 흐름으로 내용을 먼저 읽고, 필요한 경우에만 편집 또는 결재 액션으로 이어집니다.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-text-muted">
                    <span className="rounded-full bg-background px-3 py-1.5">
                      작성자 {renderUserName(document.author)}
                    </span>
                    <span className="rounded-full bg-background px-3 py-1.5">
                      수정 {formatDate(document.updatedAt)}
                    </span>
                    {document.currentStepLabel ? (
                      <span className="rounded-full bg-background px-3 py-1.5">
                        현재 단계 {document.currentStepLabel}
                      </span>
                    ) : null}
                  </div>
                </header>

                <section className="rounded-[32px] border border-background/60 bg-surface p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text">
                    <FileText className="h-4 w-4 text-primary" />
                    문서 본문
                  </div>
                  {document.content.trim() ? (
                    <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
                      <MarkdownContent>{document.content}</MarkdownContent>
                    </article>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-background bg-background/60 px-6 py-10 text-center text-sm text-text-muted">
                      본문이 비어 있습니다.
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {!isLoading && !document ? (
              <div className="mx-auto max-w-3xl rounded-[32px] border border-dashed border-background bg-background/60 px-8 py-14 text-center text-sm leading-6 text-text-muted">
                문서를 찾지 못했거나 접근 권한이 없습니다.
              </div>
            ) : null}
          </div>

          {document ? (
            <div className="z-10 flex h-20 shrink-0 items-center border-t border-background/60 bg-surface px-12">
              <div className="flex-1">
                <div className="text-[10px] font-black tracking-wider text-text-muted">
                  DOCUMENT STATUS
                </div>
                <div className="mt-1 text-sm font-semibold text-text">
                  {statusLabelMap[document.status]}
                  {document.currentStepLabel
                    ? ` · 현재 단계 ${document.currentStepLabel}`
                    : ""}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {document.permissions.canEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-pill"
                    onClick={onEdit}
                    disabled={isActionPending}
                  >
                    <PencilLine className="h-4 w-4" />
                    편집
                  </Button>
                ) : null}

                {document.permissions.canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-pill border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={onDelete}
                    disabled={isActionPending}
                  >
                    {deletePending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    삭제
                  </Button>
                ) : null}

                {document.permissions.canSubmit ? (
                  <Button
                    type="button"
                    className="rounded-pill"
                    onClick={onSubmit}
                    disabled={isActionPending}
                  >
                    {submitPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    결재 요청
                  </Button>
                ) : null}

                {document.permissions.canApprove ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-pill"
                      onClick={onApprove}
                      disabled={isActionPending}
                    >
                      {approvalPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCheck className="h-4 w-4" />
                      )}
                      승인
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-pill"
                      onClick={onReject}
                      disabled={isActionPending}
                    >
                      {approvalPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      반려
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
