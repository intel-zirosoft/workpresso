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
  EyeOff,
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
import { cn } from "@/lib/utils";
import {
  documentTemplateOptions,
  renderUserName,
  type DocumentTemplateId,
  type EditorState,
  type EditorStep,
} from "@/features/pod-a/components/document-workspace-shared";
import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";

type DocumentEditorDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  currentUserId: string;
  isMutating: boolean;
  canSaveDraft: boolean;
  canProceedFromContentStep: boolean;
  errorMessage: string | null;
  editorState: EditorState;
  availableUsers: DocumentUser[];
  isUsersLoading: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  currentStep: EditorStep;
  selectedTemplateId: DocumentTemplateId;
  isPreviewVisible: boolean;
  onStepChange: (step: EditorStep) => void;
  onTemplateSelect: (templateId: DocumentTemplateId) => void;
  onTogglePreview: () => void;
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

type ToolbarActionButtonProps = {
  icon: typeof Bold;
  label: string;
  shortcut: string;
  onClick: () => void;
  pressed?: boolean;
};

function ToolbarActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  pressed = false,
}: ToolbarActionButtonProps) {
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "ghost"}
      className="group rounded-pill"
      onClick={onClick}
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span className="hidden text-xs text-text/55 group-hover:inline group-focus-visible:inline">
        ({shortcut})
      </span>
    </Button>
  );
}

export function DocumentEditorDialog({
  isOpen,
  onOpenChange,
  mode,
  currentUserId,
  isMutating,
  canSaveDraft,
  canProceedFromContentStep,
  errorMessage,
  editorState,
  availableUsers,
  isUsersLoading,
  textareaRef,
  currentStep,
  selectedTemplateId,
  isPreviewVisible,
  onStepChange,
  onTemplateSelect,
  onTogglePreview,
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
  const steps =
    mode === "create"
      ? [
          {
            value: "template" as const,
            label: "1단계",
            description: "템플릿 선택",
          },
          {
            value: "content" as const,
            label: "2단계",
            description: "제목과 문서",
          },
          {
            value: "workflow" as const,
            label: "3단계",
            description: "결재선과 공람",
          },
        ]
      : [
          {
            value: "content" as const,
            label: "1단계",
            description: "제목과 문서",
          },
          {
            value: "workflow" as const,
            label: "2단계",
            description: "결재선과 공람",
          },
        ];
  const currentStepIndex = Math.max(
    steps.findIndex((step) => step.value === currentStep),
    0,
  );
  const previousStep =
    currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
  const nextStep =
    currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null;
  const isLastStep = currentStep === steps[steps.length - 1]?.value;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden border-none bg-surface p-0 shadow-2xl sm:h-[95vh]">
        <DialogHeader className="border-b border-background/70 bg-background/35 px-6 py-5 pr-14 text-left">
          <DialogTitle className="font-headings text-2xl text-text">
            {mode === "edit" ? "문서 편집" : "새 문서 작성"}
          </DialogTitle>
          <DialogDescription className="font-body text-text/70">
            정보량은 단계별로 나누고, 작성 중 필요한 기능만 그때그때 드러내는
            멀티 스텝 작업 공간입니다.
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          {errorMessage ? (
            <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="border-b border-background/70 bg-background/20 px-6 py-4">
            <div className="grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => {
                const isActive = step.value === currentStep;
                const isCompleted = index < currentStepIndex;

                return (
                  <button
                    key={step.value}
                    type="button"
                    onClick={() => {
                      if (
                        step.value === "workflow" &&
                        currentStep !== "workflow" &&
                        !canProceedFromContentStep
                      ) {
                        return;
                      }

                      onStepChange(step.value);
                    }}
                    className={cn(
                      "rounded-md border px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-background/70 bg-surface/80",
                    )}
                    disabled={
                      step.value === "workflow" &&
                      currentStep !== "workflow" &&
                      !canProceedFromContentStep
                    }
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-text/55">
                      {step.label}
                    </div>
                    <div className="mt-1 font-semibold text-text">
                      {step.description}
                    </div>
                    <div className="mt-2 text-xs text-text/55">
                      {isActive ? "현재 단계" : isCompleted ? "완료" : "이동"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {currentStep === "template" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-headings text-xl text-text">
                    템플릿 선택
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text/65">
                    원하는 문서 형식으로 시작하거나, 건너뛰고 빈 문서부터 직접
                    작성할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {documentTemplateOptions.map((template) => {
                    const isSelected = selectedTemplateId === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => onTemplateSelect(template.id)}
                        className={cn(
                          "rounded-md border p-5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-soft"
                            : "border-background/70 bg-background/45 hover:bg-background/65",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-headings text-lg text-text">
                              {template.label}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-text/65">
                              {template.summary}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-pill px-3 py-1 text-xs font-semibold",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-surface text-text/70",
                            )}
                          >
                            {isSelected ? "선택됨" : "선택"}
                          </span>
                        </div>

                        {template.title || template.content ? (
                          <div className="mt-4 rounded-md bg-surface/80 px-4 py-3 text-sm text-text/65">
                            <div className="font-semibold text-text">
                              {template.title || "제목 없음"}
                            </div>
                            <div className="mt-2 line-clamp-4 whitespace-pre-line leading-6">
                              {template.content}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-md border border-dashed border-background/80 px-4 py-4 text-sm text-text/55">
                            빈 문서부터 시작합니다.
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep === "content" ? (
              <div className="space-y-6">
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
                  <div className="flex items-center justify-between text-xs text-text/55">
                    <span>
                      제목은 결재 목록과 상세 화면에서 함께 사용됩니다.
                    </span>
                    <span>
                      {editorState.title.trim().length}/
                      {DOCUMENT_TITLE_MAX_LENGTH}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 rounded-md bg-background/60 p-3">
                    <ToolbarActionButton
                      icon={Bold}
                      label="굵게"
                      shortcut="Ctrl+B"
                      onClick={onApplyBold}
                    />
                    <ToolbarActionButton
                      icon={Italic}
                      label="기울임"
                      shortcut="Ctrl+I"
                      onClick={onApplyItalic}
                    />
                    <ToolbarActionButton
                      icon={Link2}
                      label="링크"
                      shortcut="Ctrl+K"
                      onClick={onApplyLink}
                    />
                    <ToolbarActionButton
                      icon={List}
                      label="불릿"
                      shortcut="Tab"
                      onClick={onApplyBulletList}
                    />
                    <ToolbarActionButton
                      icon={ListOrdered}
                      label="번호"
                      shortcut="Tab"
                      onClick={onApplyOrderedList}
                    />
                    <ToolbarActionButton
                      icon={Quote}
                      label="인용"
                      shortcut="Enter"
                      onClick={onApplyQuote}
                    />
                    <ToolbarActionButton
                      icon={Heading1}
                      label="제목 +"
                      shortcut="Ctrl+]"
                      onClick={onIncreaseHeading}
                    />
                    <ToolbarActionButton
                      icon={ChevronRight}
                      label="제목 -"
                      shortcut="Ctrl+["
                      onClick={onDecreaseHeading}
                    />
                    <ToolbarActionButton
                      icon={isPreviewVisible ? EyeOff : Eye}
                      label="미리보기"
                      shortcut="Ctrl+Shift+V"
                      onClick={onTogglePreview}
                      pressed={isPreviewVisible}
                    />
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={editorState.content}
                    onChange={onContentChange}
                    onKeyDown={onContentKeyDown}
                    maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                    placeholder={`# 문서 초안\n\n필요한 내용을 Markdown으로 작성해 보세요.\n\n- 목적\n- 배경\n- 요청 사항`}
                    className="min-h-[420px] w-full rounded-md bg-background/80 px-4 py-4 font-body text-sm leading-7 text-text shadow-inner outline-none ring-1 ring-background transition focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70 xl:min-h-[540px]"
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

                {isPreviewVisible ? (
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
                ) : null}
              </div>
            ) : null}

            {currentStep === "workflow" ? (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-background/70 bg-background/30 px-6 py-4">
            <div className="text-sm text-text/55">
              {steps[currentStepIndex]?.description}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-pill"
                onClick={onCancel}
                disabled={isMutating}
              >
                취소
              </Button>

              {previousStep ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-pill"
                  onClick={() => onStepChange(previousStep.value)}
                  disabled={isMutating}
                >
                  이전
                </Button>
              ) : null}

              {nextStep ? (
                <Button
                  type="button"
                  className="rounded-pill"
                  onClick={() => onStepChange(nextStep.value)}
                  disabled={
                    isMutating ||
                    (currentStep === "content" && !canProceedFromContentStep)
                  }
                >
                  다음
                </Button>
              ) : null}

              {isLastStep ? (
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
              ) : null}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
