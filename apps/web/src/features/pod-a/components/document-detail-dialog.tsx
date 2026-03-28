"use client";

import { CheckCheck, Loader2, PencilLine, Send, XCircle } from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type DocumentDetail } from "@/features/pod-a/services/document-schema";
import {
  formatDate,
  renderUserName,
  statusBadgeClassMap,
  statusLabelMap,
} from "@/features/pod-a/components/document-workspace-shared";

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
  submitPending: boolean;
  approvalPending: boolean;
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
  submitPending,
  approvalPending,
}: DocumentDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden border-none bg-surface p-0 shadow-2xl sm:h-[90vh]">
        <DialogHeader className="border-b border-background/70 bg-background/35 px-6 py-5 pr-14 text-left">
          <DialogTitle className="font-headings text-2xl text-text">
            문서 상세
          </DialogTitle>
          <DialogDescription className="font-body text-text/70">
            읽기 전용으로 빠르게 확인하고, 필요한 경우에만 편집이나 결재
            액션으로 이어집니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {errorMessage ? (
            <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-text/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                문서 상세를 불러오는 중입니다.
              </div>
            ) : null}

            {!isLoading && document ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-pill px-3 py-1 text-xs font-semibold",
                      statusBadgeClassMap[document.status],
                    )}
                  >
                    {statusLabelMap[document.status]}
                  </span>
                  <span className="text-xs text-text/55">
                    작성자 {renderUserName(document.author)}
                  </span>
                  <span className="text-xs text-text/55">
                    수정 {formatDate(document.updatedAt)}
                  </span>
                  {document.currentStepLabel ? (
                    <span className="text-xs text-text/55">
                      현재 단계 {document.currentStepLabel}
                    </span>
                  ) : null}
                </div>

                <div className="rounded-md bg-background/60 p-4">
                  <div className="mb-2 text-sm font-semibold text-text">
                    결재 타임라인
                  </div>
                  <div className="space-y-3">
                    {document.approvalSteps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 rounded-md bg-surface px-4 py-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {step.stepOrder}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-text">
                            {step.stepLabel}
                          </div>
                          <div className="text-sm text-text/60">
                            {renderUserName(step.approver)}
                          </div>
                        </div>
                        <div className="text-right text-xs text-text/60">
                          <div>{step.status}</div>
                          <div>{formatDate(step.actedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md bg-background/60 p-4">
                  <div className="mb-3 text-sm font-semibold text-text">
                    공람 대상
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document.ccRecipients.length === 0 ? (
                      <span className="text-sm text-text/55">공람자 없음</span>
                    ) : (
                      document.ccRecipients.map((recipient) => (
                        <span
                          key={recipient.id}
                          className="rounded-pill bg-primary/10 px-3 py-1 text-sm text-primary"
                        >
                          {renderUserName(recipient.recipient)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
                  <h1>{document.title}</h1>
                  <MarkdownContent>
                    {document.content || "_본문이 비어 있습니다._"}
                  </MarkdownContent>
                </article>
              </div>
            ) : null}

            {!isLoading && !document ? (
              <div className="rounded-md bg-background/60 px-5 py-8 text-center text-sm leading-6 text-text/60">
                문서를 찾지 못했거나 접근 권한이 없습니다.
              </div>
            ) : null}
          </div>

          {document ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-background/70 bg-background/30 px-6 py-4">
              {document.permissions.canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-pill"
                  onClick={onEdit}
                >
                  <PencilLine className="h-4 w-4" />
                  편집
                </Button>
              ) : null}

              {document.permissions.canSubmit ? (
                <Button
                  type="button"
                  className="rounded-pill"
                  onClick={onSubmit}
                  disabled={submitPending}
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
                    disabled={approvalPending}
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
                    disabled={approvalPending}
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
