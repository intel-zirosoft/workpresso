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
  Expand,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Heading1,
  Italic,
  LayoutTemplate,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minimize2,
  Plus,
  Quote,
  Sparkles,
  UserPlus,
  X,
  FileEdit,
  CreditCard,
  Target,
  ShoppingCart,
  ClipboardCheck,
  Calendar,
  Check,
} from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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

const TEMPLATE_ICONS: Record<string, any> = {
  general: FileText,
  expense: CreditCard,
  project: Target,
  purchase: ShoppingCart,
  report: ClipboardCheck,
  leave: Calendar,
  skip: Plus,
};

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
  isExpandedContentView: boolean;
  onStepChange: (step: EditorStep) => void;
  onTemplateSelect: (templateId: DocumentTemplateId) => void;
  onTogglePreview: () => void;
  onShowEditor: () => void;
  onShowPreview: () => void;
  onToggleExpandedContentView: () => void;
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
      className="rounded-pill"
      onClick={onClick}
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}

function PreviewPanel({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-md bg-background/80 px-4 py-4 shadow-inner ring-1 ring-background">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
        <Eye className="h-4 w-4" />
        미리보기
      </div>
      {title.trim() || content.trim() ? (
        <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
          {title.trim() ? <h1>{title.trim()}</h1> : null}
          <MarkdownContent>
            {content || "_본문이 비어 있습니다._"}
          </MarkdownContent>
        </article>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed border-primary/20 bg-surface/60 px-6 py-10 text-center text-sm leading-6 text-text/60">
          제목과 본문을 입력하면 이 영역에 미리보기가 표시됩니다.
        </div>
      )}
    </div>
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
  isExpandedContentView,
  onStepChange,
  onTemplateSelect,
  onTogglePreview,
  onShowEditor,
  onShowPreview,
  onToggleExpandedContentView,
  onSubmit,
  onCancel,
  onTitleChange,
  onUpdateApprovalStep,
  onAddApprovalStep,
  onRemoveApprovalStep,
  onToggleCcRecipient,
  onContentChange,
  onContentChange: _onContentChange, // Avoid naming conflict if necessary, but we'll use props
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
  const showExpandedLayer = currentStep === "content" && isExpandedContentView;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-7xl flex-row gap-0 overflow-hidden border-none bg-white p-0 shadow-2xl sm:h-[95vh]"
      >
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-slate-50 border-r border-slate-100 flex flex-col p-8 shrink-0">
          <div className="mb-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-1">Steps</h2>
            <p className="text-[13px] text-slate-400 font-medium tracking-tight">Document Progress</p>
          </div>

          <nav className="flex flex-col gap-2">
            {steps.map((step, index) => {
              const isActive = step.value === currentStep;
              const isCompleted = index < currentStepIndex;
              const StepIcon = (() => {
                if (step.value === "template") return LayoutTemplate;
                if (step.value === "content") return FileEdit;
                if (step.value === "workflow") return GitBranch;
                return FileText;
              })();

              return (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => {
                    if (step.value === "workflow" && currentStep !== "workflow" && !canProceedFromContentStep) return;
                    onStepChange(step.value);
                  }}
                  disabled={step.value === "workflow" && currentStep !== "workflow" && !canProceedFromContentStep}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 text-left relative",
                    isActive 
                      ? "bg-primary/10 text-primary border-l-4 border-primary -ml-[2px]" 
                      : "text-slate-400 hover:bg-slate-100/50 hover:text-slate-600"
                  )}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" strokeWidth={4} />
                    </div>
                  ) : (
                    <StepIcon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                  )}
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold tracking-tight">
                      {index + 1}. {step.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <footer className="mt-auto pt-8">
            <button
              type="button"
              className="group flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all focus:outline-none"
            >
              <span className="text-lg font-bold">?</span>
            </button>
          </footer>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-6 right-8 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors z-50"
          >
            <X className="h-6 w-6" />
          </button>

          <form
            className="flex flex-col flex-1 min-h-0"
            onSubmit={onSubmit}
          >
            {errorMessage ? (
              <div className="bg-rose-50 px-6 py-3 text-sm font-medium text-rose-600 border-b border-rose-100">
                <span className="mr-2">⚠️</span> {errorMessage}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto pt-16 pb-24 px-12">
              <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm ring-1 ring-primary/5">
                    STEP {currentStepIndex + 1 < 10 ? `0${currentStepIndex + 1}` : currentStepIndex + 1}
                  </div>
                  <h1 className="text-4xl font-headings font-black text-slate-800 tracking-tight mb-3">
                    {currentStep === "template" ? "원하는 템플릿을 선택하세요" : 
                     currentStep === "content" ? "문서의 제목과 내용을 입력하세요" : 
                     "결재선과 공람 대상을 설정하세요"}
                  </h1>
                  <p className="text-[15px] font-medium text-slate-400 leading-relaxed max-w-2xl">
                    {currentStep === "template" ? "작성하시려는 문서의 성격에 가장 적합한 양식을 골라주세요." : 
                     currentStep === "content" ? "Markdown 형식을 지원하며 실시간 미리보기를 통해 확인하실 수 있습니다." : 
                     "문서 승인 절차를 위한 결재자와 참조인을 지정해 주세요."}
                  </p>
                </header>

                {currentStep === "template" ? (
                  <div className="grid gap-8 xl:grid-cols-2">
                    {documentTemplateOptions.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      const TemplateIcon = TEMPLATE_ICONS[template.id] || FileText;

                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => onTemplateSelect(template.id)}
                          className={cn(
                            "group relative flex flex-col rounded-[32px] border-2 p-7 text-left transition-all duration-300",
                            isSelected
                              ? "border-primary bg-primary/[0.04] shadow-xl shadow-primary/10 scale-[1.02] z-10"
                              : "border-slate-100 bg-white hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
                          )}
                        >
                          <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "flex h-14 w-14 items-center justify-center rounded-2xl transition-all shadow-sm",
                                isSelected ? "bg-primary text-white" : "bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white"
                              )}>
                                <TemplateIcon className="h-7 w-7" />
                              </div>
                              <div>
                                <div className={cn(
                                  "text-xl font-bold transition-colors tracking-tight",
                                  isSelected ? "text-primary" : "text-slate-800"
                                )}>
                                  {template.label}
                                </div>
                                <div className="text-[12px] text-slate-400 font-medium mt-0.5">
                                  {template.summary}
                                </div>
                              </div>
                            </div>
                            
                            <div className={cn(
                              "h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center",
                              isSelected ? "border-primary bg-primary" : "border-slate-200 bg-white group-hover:border-primary/40"
                            )}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
                            </div>
                          </div>

                          <div className={cn(
                            "mt-auto rounded-2xl p-7 text-[13px] transition-all border shadow-sm",
                            isSelected 
                              ? "bg-white/80 text-slate-600 border-primary/20" 
                              : "bg-slate-50/50 text-slate-400 border-slate-100 group-hover:bg-white"
                          )}>
                             <div className="space-y-4">
                               <div className={cn("font-bold text-[14px]", isSelected ? "text-primary" : "text-slate-500")}>
                                 ## {template.id === 'expense' ? '지출' : (template.id === 'leave' ? '휴가' : '요청')} 개요
                               </div>
                               <div className="space-y-2 px-0.5">
                                 {template.id === 'general' && (
                                   <>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-primary font-bold">제목:</span> <span className="bg-slate-200/50 h-3 w-16 rounded-sm" /></div>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-primary font-bold">목적:</span> <span className="bg-slate-200/50 h-3 w-32 rounded-sm" /></div>
                                   </>
                                 )}
                                 {template.id === 'expense' && (
                                   <>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-slate-500 font-bold">지출 항목:</span> <span className="bg-slate-200/50 h-3 w-16 rounded-sm" /></div>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-slate-500 font-bold">지출 목적:</span> <span className="bg-slate-200/50 h-3 w-32 rounded-sm" /></div>
                                   </>
                                 )}
                                 {template.id === 'leave' && (
                                   <>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-slate-500 font-bold">휴가 종류:</span> <span className="bg-slate-200/50 h-3 w-16 rounded-sm" /></div>
                                     <div className="flex items-center gap-2 text-[12.5px] opacity-80">- <span className="text-slate-500 font-bold">신청 기간:</span> <span className="bg-slate-200/50 h-3 w-40 rounded-sm" /></div>
                                   </>
                                 )}
                                 {template.id === 'skip' && (
                                    <div className="flex flex-col items-center justify-center py-2 opacity-40">
                                      <Plus className="h-8 w-8 mb-2" />
                                      <p className="font-bold">새 양식 만들기</p>
                                    </div>
                                 )}
                                 {!['general', 'expense', 'leave', 'skip'].includes(template.id) && (
                                   <div className="line-clamp-2 italic text-[12.5px] opacity-70">
                                     {template.content}
                                   </div>
                                 )}
                               </div>
                             </div>
                          </div>
                          
                          {isSelected && (
                            <div className="absolute top-3 right-14 flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full shadow-lg scale-90 animate-in zoom-in-50">
                              <span className="text-[9px] font-black text-white tracking-widest">SELECTED</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {currentStep === "content" ? (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label htmlFor="document-title" className="text-[15px] font-bold text-slate-800">제목</label>
                      <div className="relative">
                        <Input
                          id="document-title"
                          value={editorState.title}
                          onChange={(e) => onTitleChange(e.target.value)}
                          maxLength={DOCUMENT_TITLE_MAX_LENGTH}
                          placeholder="예: 2026년 2분기 협업 운영 계획"
                          className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white pr-16 text-lg font-medium"
                          disabled={isDisabled}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-slate-400 font-bold">
                          {editorState.title.length}/{DOCUMENT_TITLE_MAX_LENGTH}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50/80 rounded-xl border border-slate-100">
                        <ToolbarActionButton icon={Bold} label="굵게" shortcut="Ctrl+B" onClick={onApplyBold} />
                        <ToolbarActionButton icon={Italic} label="기울임" shortcut="Ctrl+I" onClick={onApplyItalic} />
                        <ToolbarActionButton icon={Link2} label="링크" shortcut="Ctrl+K" onClick={onApplyLink} />
                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                        <ToolbarActionButton icon={List} label="불릿" shortcut="Tab" onClick={onApplyBulletList} />
                        <ToolbarActionButton icon={ListOrdered} label="번호" shortcut="Tab" onClick={onApplyOrderedList} />
                        <ToolbarActionButton icon={Quote} label="인용" shortcut="Enter" onClick={onApplyQuote} />
                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                        <ToolbarActionButton icon={Heading1} label="H+" shortcut="Ctrl+]" onClick={onIncreaseHeading} />
                        <ToolbarActionButton icon={ChevronRight} label="H-" shortcut="Ctrl+[" onClick={onDecreaseHeading} />
                        <div className="ml-auto flex items-center gap-1.5">
                          <Button 
                            type="button" 
                            variant={isPreviewVisible ? "secondary" : "ghost"} 
                            size="sm"
                            className="rounded-lg h-8 px-3"
                            onClick={onTogglePreview}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            미리보기
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="rounded-lg h-8 px-3 text-slate-400"
                            onClick={onToggleExpandedContentView}
                          >
                            <Expand className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="relative group">
                        {!isPreviewVisible ? (
                          <textarea
                            ref={textareaRef}
                            value={editorState.content}
                            onChange={onContentChange}
                            onKeyDown={onContentKeyDown}
                            maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                            placeholder="문서 내용을 입력하세요..."
                            className="min-h-[500px] w-full resize-none rounded-2xl border-slate-100 bg-slate-50/30 p-8 font-body text-[15px] leading-relaxed text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-primary/5 disabled:opacity-50"
                            disabled={isDisabled}
                          />
                        ) : (
                          <div className="min-h-[500px] rounded-2xl border border-slate-100 bg-white p-8">
                            <PreviewPanel title={editorState.title} content={editorState.content} />
                          </div>
                        )}
                        <div className="absolute bottom-4 right-6 text-[11px] font-black text-slate-300 tracking-wider">
                          {editorState.content.length.toLocaleString()} / {DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === "workflow" ? (
                  <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">결재선 구성</h3>
                        <Button type="button" variant="outline" size="sm" className="rounded-lg border-slate-200 font-bold" onClick={onAddApprovalStep} disabled={isMutating}>
                          <Plus className="h-4 w-4 mr-2" /> 단계 추가
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {editorState.approvalSteps.map((step, index) => (
                          <div key={step.localId} className="group relative flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-primary border border-slate-100">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                               <input
                                 className="w-full bg-transparent font-bold text-slate-800 outline-none focus:text-primary transition-colors"
                                 value={step.stepLabel}
                                 onChange={(e) => onUpdateApprovalStep(step.localId, "stepLabel", e.target.value)}
                                 placeholder={`단계 ${index + 1}`}
                               />
                               <select
                                 className="w-full bg-transparent text-sm text-slate-400 outline-none appearance-none cursor-pointer"
                                 value={step.approverId}
                                 onChange={(e) => onUpdateApprovalStep(step.localId, "approverId", e.target.value)}
                               >
                                 <option value="">결재자 선택</option>
                                 {availableUsers.map(user => <option key={user.id} value={user.id}>{renderUserName(user)}</option>)}
                               </select>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemoveApprovalStep(step.localId)} disabled={editorState.approvalSteps.length === 1}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-slate-800">공람 대상</h3>
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-wrap gap-2">
                        {availableUsers.map((user) => {
                          const isSelected = editorState.ccRecipientIds.includes(user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => onToggleCcRecipient(user.id)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                isSelected ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-slate-500 border border-slate-100 hover:border-primary/30"
                              )}
                            >
                              <UserPlus className="h-4 w-4" />
                              {renderUserName(user).split(' · ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {showExpandedLayer && (
              <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in fade-in zoom-in-95 duration-300">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div className="font-bold text-slate-800">집중 보기 모드</div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant={isPreviewVisible ? "ghost" : "secondary"} size="sm" className="rounded-lg" onClick={onShowEditor}>편집</Button>
                    <Button type="button" variant={isPreviewVisible ? "secondary" : "ghost"} size="sm" className="rounded-lg" onClick={onShowPreview}>미리보기</Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-lg ml-2" onClick={onToggleExpandedContentView}><Minimize2 className="h-4 w-4 mr-2" /> 기본 보기</Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12">
                   <div className="max-w-4xl mx-auto">
                    {!isPreviewVisible ? (
                      <textarea
                        ref={textareaRef}
                        value={editorState.content}
                        onChange={onContentChange}
                        onKeyDown={onContentKeyDown}
                        maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                        className="w-full min-h-[70vh] bg-transparent text-lg leading-relaxed outline-none resize-none"
                        placeholder="이곳에 내용을 작성하세요..."
                      />
                    ) : (
                      <PreviewPanel title={editorState.title} content={editorState.content} />
                    )}
                   </div>
                </div>
              </div>
            )}

            <div className="h-20 border-t border-slate-100 bg-white flex items-center px-12 shrink-0 z-10">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-black text-slate-800 tracking-wider">
                    STEP {currentStepIndex + 1} OF 4
                  </div>
                  <div className="w-32 h-[3px] bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${((currentStepIndex + 1) / 4) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-primary font-bold text-[14px] px-6 hover:underline"
                  disabled={isMutating}
                >
                  취소
                </button>

                {previousStep && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl font-bold px-7 border-slate-200"
                    onClick={() => onStepChange(previousStep.value)}
                    disabled={isMutating}
                  >
                    이전
                  </Button>
                )}

                {nextStep ? (
                  <Button
                    type="button"
                    className="rounded-xl font-bold px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    onClick={() => onStepChange(nextStep.value)}
                    disabled={isMutating || (currentStep === "content" && !canProceedFromContentStep)}
                  >
                    다음
                  </Button>
                ) : isLastStep ? (
                  <Button
                    type="submit"
                    disabled={!canSaveDraft}
                    className="rounded-xl font-bold px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
