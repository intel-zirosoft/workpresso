"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import {
  Bold,
  ChevronRight,
  Eye,
  FileText,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Quote,
  UserPlus,
  X,
} from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";
import {
  renderUserName,
  type EditorState,
} from "@/features/pod-a/components/document-workspace-shared";

type DocumentEditorDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  currentUserId: string;
  isMutating: boolean;
  canSaveDraft: boolean;
  errorMessage: string | null;
  editorState: EditorState;
  availableUsers: DocumentUser[];
  isUsersLoading: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onTitleChange: (value: string) => void;
  onUpdateApprovalStep: (
    localId: string,
    key: "stepLabel" | "approverId",
    value: string,
  ) => void;
  onAddApprovalStep: () => void;
  onRemoveApprovalStep: (localId: string) => void;
  onToggleCcRecipient: (recipientId: string) => void;
  onContentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onContentKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onApplyBold: () => void;
  onApplyItalic: () => void;
  onApplyLink: () => void;
  onApplyBulletList: () => void;
  onApplyOrderedList: () => void;
  onApplyQuote: () => void;
  onIncreaseHeading: () => void;
  onDecreaseHeading: () => void;
};

export function DocumentEditorDialog({
  isOpen,
  onOpenChange,
  mode,
  currentUserId,
  isMutating,
  canSaveDraft,
  errorMessage,
  editorState,
  availableUsers,
  isUsersLoading,
  textareaRef,
  onSubmit,
  onCancel,
  onTitleChange,
  onUpdateApprovalStep,
  onAddApprovalStep,
  onRemoveApprovalStep,
  onToggleCcRecipient,
  onContentChange,
  onContentKeyDown,
  onApplyBold,
  onApplyItalic,
  onApplyLink,
  onApplyBulletList,
  onApplyOrderedList,
  onApplyQuote,
  onIncreaseHeading,
  onDecreaseHeading,
}: DocumentEditorDialogProps) {
  const isDisabled = !currentUserId || isMutating;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden border-none bg-surface p-0 shadow-2xl sm:h-[95vh]">
        <DialogHeader className="border-b border-background/70 bg-background/35 px-6 py-5 pr-14 text-left">
          <DialogTitle className="font-headings text-2xl text-text">
            {mode === "edit" ? "문서 편집" : "새 문서 작성"}
          </DialogTitle>
          <DialogDescription className="font-body text-text/70">
            결재선, 공람자, Markdown 본문과 미리보기를 한 작업 공간에서
            정리합니다.
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          {errorMessage ? (
            <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-2">
                  <label
                    htmlFor="document-title"
                    className="text-sm font-bold text-text"
                  >
                    제목
                  </label>
                  <Input
                    id="document-title"
                    value={editorState.title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    maxLength={DOCUMENT_TITLE_MAX_LENGTH}
                    placeholder="예: 2026년 2분기 협업 운영 계획"
                    className="h-12 rounded-md border-background bg-background/70"
                    disabled={isDisabled}
                  />
                  <p className="text-xs text-text/55">
                    {editorState.title.trim().length}/
                    {DOCUMENT_TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div className="rounded-md bg-background/60 px-4 py-4 text-sm text-text/70">
                  <div className="font-semibold text-text">단축키</div>
                  <div className="mt-2 space-y-1">
                    <p>`Ctrl/Cmd+B` 굵게</p>
                    <p>`Ctrl/Cmd+I` 기울임</p>
                    <p>`Ctrl/Cmd+K` 링크</p>
                    <p>`Ctrl/Cmd+]` 제목 단계 증가</p>
                    <p>`Ctrl/Cmd+[` 제목 단계 감소</p>
                    <p>`Tab` 들여쓰기 / `Shift+Tab` 내어쓰기</p>
                    <p>`Enter` 목록, 인용, 들여쓰기 이어쓰기</p>
                    <p>
                      `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y`
                      실행취소/다시실행
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-md bg-background/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-headings text-lg text-text">
                          결재선
                        </h3>
                        <p className="text-sm text-text/60">
                          기본 3단계 레이블을 제공하고, 필요 시 단계를 추가할 수
                          있습니다.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-pill"
                        onClick={onAddApprovalStep}
                        disabled={isMutating}
                      >
                        <Plus className="h-4 w-4" />
                        단계 추가
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editorState.approvalSteps.map((step, index) => (
                        <div
                          key={step.localId}
                          className="grid gap-3 rounded-md bg-surface p-4 md:grid-cols-[0.7fr_1fr_auto]"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-text/55">
                              단계 이름
                            </label>
                            <Input
                              value={step.stepLabel}
                              onChange={(event) =>
                                onUpdateApprovalStep(
                                  step.localId,
                                  "stepLabel",
                                  event.target.value,
                                )
                              }
                              placeholder={`단계 ${index + 1}`}
                              disabled={isMutating}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-text/55">
                              결재자
                            </label>
                            <select
                              value={step.approverId}
                              onChange={(event) =>
                                onUpdateApprovalStep(
                                  step.localId,
                                  "approverId",
                                  event.target.value,
                                )
                              }
                              disabled={isMutating || isUsersLoading}
                              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">결재자를 선택하세요</option>
                              {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {renderUserName(user)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => onRemoveApprovalStep(step.localId)}
                              disabled={
                                editorState.approvalSteps.length === 1 ||
                                isMutating
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md bg-background/55 p-4">
                    <div>
                      <h3 className="font-headings text-lg text-text">
                        공람 대상
                      </h3>
                      <p className="text-sm text-text/60">
                        승인 권한은 없지만 문서를 열람해야 하는 사용자를
                        선택합니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableUsers.map((user) => {
                        const isSelected = editorState.ccRecipientIds.includes(
                          user.id,
                        );

                        return (
                          <Button
                            key={user.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className="rounded-pill"
                            onClick={() => onToggleCcRecipient(user.id)}
                            disabled={isMutating}
                          >
                            <UserPlus className="h-4 w-4" />
                            {renderUserName(user)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 rounded-md bg-background/60 p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyBold}
                      >
                        <Bold className="h-4 w-4" />B
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyItalic}
                      >
                        <Italic className="h-4 w-4" />I
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyLink}
                      >
                        <Link2 className="h-4 w-4" />
                        링크
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyBulletList}
                      >
                        <List className="h-4 w-4" />
                        불릿
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyOrderedList}
                      >
                        <ListOrdered className="h-4 w-4" />
                        번호
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onApplyQuote}
                      >
                        <Quote className="h-4 w-4" />
                        인용
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onIncreaseHeading}
                      >
                        <Heading1 className="h-4 w-4" />
                        제목 +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={onDecreaseHeading}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        제목 -
                      </Button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={editorState.content}
                      onChange={onContentChange}
                      onKeyDown={onContentKeyDown}
                      maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                      placeholder={`# 문서 초안\n\n필요한 내용을 Markdown으로 작성해 보세요.\n\n- 목적\n- 배경\n- 요청 사항`}
                      className="min-h-[360px] w-full rounded-md bg-background/80 px-4 py-4 font-body text-sm leading-7 text-text shadow-inner outline-none ring-1 ring-background transition focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70 xl:min-h-[520px]"
                      disabled={isDisabled}
                    />
                    <div className="flex items-center justify-between text-xs text-text/55">
                      <span>Markdown 문자열을 그대로 저장합니다.</span>
                      <span>
                        {editorState.content.length}/
                        {DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-md bg-background/70 p-6 shadow-inner">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                      <Eye className="h-4 w-4" />
                      미리보기
                    </div>
                    {editorState.title.trim() || editorState.content.trim() ? (
                      <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
                        {editorState.title.trim() ? (
                          <h1>{editorState.title.trim()}</h1>
                        ) : null}
                        <MarkdownContent>
                          {editorState.content || "_본문이 비어 있습니다._"}
                        </MarkdownContent>
                      </article>
                    ) : (
                      <div className="rounded-md border border-dashed border-primary/20 bg-surface/60 px-6 py-10 text-center text-sm leading-6 text-text/60">
                        제목과 본문을 입력하면 이 영역에 미리보기가 표시됩니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-background/70 bg-background/30 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-pill"
              onClick={onCancel}
              disabled={isMutating}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!canSaveDraft}
              className="rounded-pill px-6"
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {mode === "edit" ? "문서 저장" : "초안 생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
