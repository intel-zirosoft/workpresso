"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  CheckCheck,
  ChevronRight,
  Eye,
  FileText,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  PencilLine,
  Plus,
  Quote,
  RefreshCw,
  Send,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdown-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  actOnDocument,
  createDocument,
  DocumentApiError,
  fetchDocument,
  fetchDocuments,
  fetchDocumentUsers,
  submitDocument,
  updateDocument,
} from "@/features/pod-a/services/document-api";
import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  type ApprovalStepInput,
  type DocumentDetail,
  type DocumentScope,
  type DocumentStatus,
  type DocumentUser,
} from "@/features/pod-a/services/document-schema";

type StatusFilter = "ALL" | DocumentStatus;

type EditorApprovalStep = ApprovalStepInput & {
  localId: string;
};

type EditorState = {
  title: string;
  content: string;
  approvalSteps: EditorApprovalStep[];
  ccRecipientIds: string[];
};

const DEFAULT_APPROVAL_STEP_LABELS = ["팀장", "부서장", "대표"];

const statusLabelMap: Record<DocumentStatus, string> = {
  DRAFT: "초안",
  PENDING: "결재 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

const statusBadgeClassMap: Record<DocumentStatus, string> = {
  DRAFT: "bg-secondary/70 text-text",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const scopeConfig: Array<{ value: DocumentScope; label: string; hint: string }> =
  [
    { value: "authored", label: "내 문서 Grid", hint: "내가 작성한 문서" },
    { value: "approvals", label: "내 결재함", hint: "지금 결재할 문서" },
    { value: "cc", label: "공람 문서", hint: "참조로 받은 문서" },
  ];

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "DRAFT", label: "초안" },
  { value: "PENDING", label: "결재 대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

function createEmptyEditorState(): EditorState {
  return {
    title: "",
    content: "",
    approvalSteps: DEFAULT_APPROVAL_STEP_LABELS.map((stepLabel, index) => ({
      localId: `${stepLabel}-${index}`,
      stepLabel,
      approverId: "",
    })),
    ccRecipientIds: [],
  };
}

function createEditorStateFromDocument(document: DocumentDetail): EditorState {
  return {
    title: document.title,
    content: document.content,
    approvalSteps: document.approvalSteps.map((step) => ({
      localId: step.id,
      stepLabel: step.stepLabel,
      approverId: step.approverId,
    })),
    ccRecipientIds: document.ccRecipients.map((recipient) => recipient.recipientId),
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof DocumentApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

function applyLinePrefix(text: string, prefix: string) {
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function getLineSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndIndex = value.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  return {
    lineStart,
    lineEnd,
    selectedText: value.slice(lineStart, lineEnd),
  };
}

export function DocumentWorkspace() {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [currentUserId, setCurrentUserId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [scope, setScope] = useState<DocumentScope>("authored");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(true);
  const [editorState, setEditorState] = useState<EditorState>(
    createEmptyEditorState(),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !user) {
        setAuthMessage("로그인한 사용자만 문서를 작성하고 조회할 수 있습니다.");
        setIsAuthLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      setAuthMessage("");
      setIsAuthLoading(false);
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const usersQuery = useQuery({
    queryKey: ["document-users"],
    queryFn: fetchDocumentUsers,
    enabled: Boolean(currentUserId),
  });

  const documentsQuery = useQuery({
    queryKey: [
      "documents",
      scope,
      statusFilter === "ALL" ? "ALL" : statusFilter,
      currentUserId,
    ],
    queryFn: () =>
      fetchDocuments({
        scope,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
    enabled: Boolean(currentUserId),
  });

  const selectedDocumentQuery = useQuery({
    queryKey: ["document", selectedDocumentId],
    queryFn: () => fetchDocument(selectedDocumentId as string),
    enabled: Boolean(selectedDocumentId),
  });

  useEffect(() => {
    if (isEditing && selectedDocumentId === null) {
      return;
    }

    const documents = documentsQuery.data ?? [];

    if (documents.length === 0) {
      setSelectedDocumentId(null);
      if (!isEditing) {
        setEditorState(createEmptyEditorState());
      }
      return;
    }

    if (!selectedDocumentId || !documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(documents[0]?.id ?? null);
      setIsEditing(false);
    }
  }, [documentsQuery.data, isEditing, selectedDocumentId]);

  const selectedDocument = selectedDocumentQuery.data ?? null;
  const submitErrorMessage = useMemo(
    () =>
      getSubmitErrorMessage(selectedDocumentQuery.error) ??
      getSubmitErrorMessage(documentsQuery.error) ??
      getSubmitErrorMessage(usersQuery.error),
    [documentsQuery.error, selectedDocumentQuery.error, usersQuery.error],
  );

  function invalidateDocumentQueries(documentId?: string) {
    void queryClient.invalidateQueries({
      queryKey: ["documents"],
    });

    if (documentId) {
      void queryClient.invalidateQueries({
        queryKey: ["document", documentId],
      });
    }
  }

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setScope("authored");
      setSelectedDocumentId(document.id);
      setIsEditing(false);
      setEditorState(createEditorStateFromDocument(document));
      invalidateDocumentQueries(document.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      documentId,
      payload,
    }: {
      documentId: string;
      payload: {
        title: string;
        content: string;
        approvalSteps: ApprovalStepInput[];
        ccRecipientIds: string[];
      };
    }) => updateDocument(documentId, payload),
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setSelectedDocumentId(document.id);
      setIsEditing(false);
      setEditorState(createEditorStateFromDocument(document));
      invalidateDocumentQueries(document.id);
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitDocument,
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setSelectedDocumentId(document.id);
      setIsEditing(false);
      setEditorState(createEditorStateFromDocument(document));
      invalidateDocumentQueries(document.id);
    },
  });

  const approvalMutation = useMutation({
    mutationFn: ({
      documentId,
      action,
      comment,
    }: {
      documentId: string;
      action: "APPROVE" | "REJECT";
      comment?: string;
    }) => actOnDocument(documentId, { action, comment }),
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setSelectedDocumentId(document.id);
      setIsEditing(false);
      invalidateDocumentQueries(document.id);
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending ||
    approvalMutation.isPending;
  const mutationErrorMessage =
    getSubmitErrorMessage(createMutation.error) ??
    getSubmitErrorMessage(updateMutation.error) ??
    getSubmitErrorMessage(submitMutation.error) ??
    getSubmitErrorMessage(approvalMutation.error);

  const availableUsers = (usersQuery.data ?? []).filter(
    (user) => user.id !== currentUserId,
  );

  const selectedDocumentSummary =
    documentsQuery.data?.find((document) => document.id === selectedDocumentId) ?? null;

  const canSaveDraft =
    Boolean(currentUserId) &&
    editorState.title.trim().length > 0 &&
    editorState.title.trim().length <= DOCUMENT_TITLE_MAX_LENGTH &&
    editorState.content.length <= DOCUMENT_CONTENT_MAX_LENGTH &&
    editorState.approvalSteps.length > 0 &&
    editorState.approvalSteps.every(
      (step) => step.stepLabel.trim().length > 0 && step.approverId,
    ) &&
    !isMutating;

  function startNewDraft() {
    setScope("authored");
    setStatusFilter("ALL");
    setSelectedDocumentId(null);
    setEditorState(createEmptyEditorState());
    setIsEditing(true);
  }

  function handleSelectDocument(documentId: string) {
    setSelectedDocumentId(documentId);
    setIsEditing(false);
  }

  function handleStartEditing() {
    if (!selectedDocument?.permissions.canEdit) {
      return;
    }

    setEditorState(createEditorStateFromDocument(selectedDocument));
    setIsEditing(true);
  }

  function handleCancelEditing() {
    if (selectedDocument) {
      setEditorState(createEditorStateFromDocument(selectedDocument));
      setIsEditing(false);
      return;
    }

    setEditorState(createEmptyEditorState());
    setIsEditing(false);
  }

  function updateEditorState<K extends keyof EditorState>(
    key: K,
    value: EditorState[K],
  ) {
    setEditorState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateApprovalStep(
    localId: string,
    key: "stepLabel" | "approverId",
    value: string,
  ) {
    setEditorState((current) => ({
      ...current,
      approvalSteps: current.approvalSteps.map((step) =>
        step.localId === localId ? { ...step, [key]: value } : step,
      ),
    }));
  }

  function addApprovalStep() {
    setEditorState((current) => ({
      ...current,
      approvalSteps: [
        ...current.approvalSteps,
        {
          localId: `step-${crypto.randomUUID()}`,
          stepLabel: `추가 단계 ${current.approvalSteps.length + 1}`,
          approverId: "",
        },
      ],
    }));
  }

  function removeApprovalStep(localId: string) {
    setEditorState((current) => ({
      ...current,
      approvalSteps:
        current.approvalSteps.length === 1
          ? current.approvalSteps
          : current.approvalSteps.filter((step) => step.localId !== localId),
    }));
  }

  function toggleCcRecipient(recipientId: string) {
    setEditorState((current) => ({
      ...current,
      ccRecipientIds: current.ccRecipientIds.includes(recipientId)
        ? current.ccRecipientIds.filter((id) => id !== recipientId)
        : [...current.ccRecipientIds, recipientId],
    }));
  }

  function applyTextTransform(
    transform: (selectedText: string) => {
      text: string;
      selectionStart?: number;
      selectionEnd?: number;
    },
  ) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = editorState.content.slice(selectionStart, selectionEnd);
    const result = transform(selectedText);
    const nextValue =
      editorState.content.slice(0, selectionStart) +
      result.text +
      editorState.content.slice(selectionEnd);

    updateEditorState("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextSelectionStart =
        result.selectionStart ?? selectionStart + result.text.length;
      const nextSelectionEnd =
        result.selectionEnd ?? selectionStart + result.text.length;
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  function handleIndentSelection() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const { lineStart, lineEnd, selectedText } = getLineSelection(
      editorState.content,
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    const indentedText = applyLinePrefix(selectedText, "  ");
    const nextValue =
      editorState.content.slice(0, lineStart) +
      indentedText +
      editorState.content.slice(lineEnd);

    updateEditorState("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + indentedText.length);
    });
  }

  function adjustHeadingLevel(direction: "increase" | "decrease") {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const { lineStart, lineEnd, selectedText } = getLineSelection(
      editorState.content,
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    const adjustedText = selectedText
      .split("\n")
      .map((line) => {
        const match = line.match(/^(#{1,6})\s+(.*)$/);

        if (direction === "increase") {
          if (!match) {
            return `# ${line}`.trimEnd();
          }

          const nextLevel = Math.min(match[1].length + 1, 6);

          return `${"#".repeat(nextLevel)} ${match[2]}`;
        }

        if (!match) {
          return line;
        }

        const nextLevel = match[1].length - 1;

        return nextLevel <= 0 ? match[2] : `${"#".repeat(nextLevel)} ${match[2]}`;
      })
      .join("\n");

    const nextValue =
      editorState.content.slice(0, lineStart) +
      adjustedText +
      editorState.content.slice(lineEnd);

    updateEditorState("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + adjustedText.length);
    });
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isMeta = event.metaKey || event.ctrlKey;

    if (event.key === "Tab") {
      event.preventDefault();
      handleIndentSelection();
      return;
    }

    if (!isMeta) {
      return;
    }

    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "굵은 텍스트";

        return {
          text: `**${text}**`,
        };
      });
      return;
    }

    if (event.key.toLowerCase() === "i") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "기울임 텍스트";

        return {
          text: `*${text}*`,
        };
      });
      return;
    }

    if (event.key.toLowerCase() === "k") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "링크 텍스트";

        return {
          text: `[${text}](https://)`,
        };
      });
      return;
    }

    if (event.key === "]") {
      event.preventDefault();
      adjustHeadingLevel("increase");
      return;
    }

    if (event.key === "[") {
      event.preventDefault();
      adjustHeadingLevel("decrease");
    }
  }

  function handleSaveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUserId || !canSaveDraft) {
      return;
    }

    const payload = {
      title: editorState.title,
      content: editorState.content,
      approvalSteps: editorState.approvalSteps.map(({ stepLabel, approverId }) => ({
        stepLabel,
        approverId,
      })),
      ccRecipientIds: editorState.ccRecipientIds,
    };

    if (selectedDocumentId) {
      updateMutation.mutate({
        documentId: selectedDocumentId,
        payload,
      });
      return;
    }

    createMutation.mutate({
      authorId: currentUserId,
      ...payload,
    });
  }

  function handleSubmitDocument() {
    if (!selectedDocument?.permissions.canSubmit || !selectedDocumentId) {
      return;
    }

    submitMutation.mutate(selectedDocumentId);
  }

  function handleApprovalAction(action: "APPROVE" | "REJECT") {
    if (!selectedDocumentId) {
      return;
    }

    approvalMutation.mutate({
      documentId: selectedDocumentId,
      action,
    });
  }

  function renderUserName(user: DocumentUser | null | undefined) {
    if (!user) {
      return "-";
    }

    return user.department ? `${user.name} · ${user.department}` : user.name;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-md bg-surface px-8 py-7 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-headings font-semibold tracking-tight text-text">
            문서 작성부터 다단계 결재까지 한 화면에서 관리하세요.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-text/80">
            읽기 우선 상세 화면, 3단계 기본 결재선, 공람 대상, Markdown
            단축키까지 포함한 문서 워크플로우 v2입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="rounded-pill px-5"
            onClick={startNewDraft}
            disabled={!currentUserId || isMutating}
          >
            <Plus className="h-4 w-4" />
            새 문서
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-pill"
            onClick={() => {
              void documentsQuery.refetch();
              if (selectedDocumentId) {
                void selectedDocumentQuery.refetch();
              }
            }}
            disabled={!currentUserId || documentsQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                documentsQuery.isFetching && "animate-spin",
              )}
            />
            새로고침
          </Button>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="rounded-md border-none bg-surface shadow-soft">
            <CardHeader className="space-y-4 border-b border-background/70 bg-background/35">
              <div>
                <CardTitle className="text-2xl font-headings text-text">
                  문서 탐색
                </CardTitle>
                <CardDescription className="font-body text-text/70">
                  작성 문서, 결재 대기 문서, 공람 문서를 scope별로 분리해
                  확인합니다.
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
                      onClick={() => {
                        setScope(item.value);
                        setIsEditing(false);
                      }}
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
                      onClick={() => setStatusFilter(filter.value)}
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

              {submitErrorMessage ? (
                <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {submitErrorMessage}
                </p>
              ) : null}

              {!isAuthLoading && documentsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  문서를 불러오는 중입니다.
                </div>
              ) : null}

              {!documentsQuery.isLoading &&
              !documentsQuery.isError &&
              (documentsQuery.data?.length ?? 0) === 0 ? (
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
                      {(documentsQuery.data ?? []).map((document) => {
                        const isSelected = selectedDocumentId === document.id;

                        return (
                          <tr
                            key={document.id}
                            className={cn(
                              "cursor-pointer border-t border-background/70 transition-colors hover:bg-background/60",
                              isSelected && "bg-primary/10",
                            )}
                            onClick={() => handleSelectDocument(document.id)}
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
                {(documentsQuery.data ?? []).map((document) => {
                  const isSelected = selectedDocumentId === document.id;

                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => handleSelectDocument(document.id)}
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
                            {document.currentStepLabel ?? statusLabelMap[document.status]}
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
                  {(documentsQuery.data ?? []).map((document) => {
                    const isSelected = selectedDocumentId === document.id;

                    return (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => handleSelectDocument(document.id)}
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

        <div className="space-y-6">
          <Card className="rounded-md border-none bg-surface shadow-soft">
            <CardHeader className="border-b border-background/70 bg-background/35">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-headings text-text">
                    {isEditing
                      ? selectedDocumentId
                        ? "문서 편집"
                        : "새 문서 작성"
                      : "문서 상세"}
                  </CardTitle>
                  <CardDescription className="font-body text-text/70">
                    {isEditing
                      ? "제목, 결재선, 공람자, Markdown 본문을 저장합니다."
                      : "기본값은 읽기 전용이며 필요할 때만 편집 모드로 전환합니다."}
                  </CardDescription>
                </div>

                {!isEditing && selectedDocument ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedDocument.permissions.canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-pill"
                        onClick={handleStartEditing}
                      >
                        <PencilLine className="h-4 w-4" />
                        편집
                      </Button>
                    ) : null}

                    {selectedDocument.permissions.canSubmit ? (
                      <Button
                        type="button"
                        className="rounded-pill"
                        onClick={handleSubmitDocument}
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        결재 요청
                      </Button>
                    ) : null}

                    {selectedDocument.permissions.canApprove ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-pill"
                          onClick={() => handleApprovalAction("APPROVE")}
                          disabled={approvalMutation.isPending}
                        >
                          {approvalMutation.isPending ? (
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
                          onClick={() => handleApprovalAction("REJECT")}
                          disabled={approvalMutation.isPending}
                        >
                          {approvalMutation.isPending ? (
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
            </CardHeader>

            <CardContent className="p-6">
              {mutationErrorMessage ? (
                <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {mutationErrorMessage}
                </p>
              ) : null}

              {isEditing ? (
                <form className="space-y-6" onSubmit={handleSaveDocument}>
                  <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
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
                        onChange={(event) =>
                          updateEditorState("title", event.target.value)
                        }
                        maxLength={DOCUMENT_TITLE_MAX_LENGTH}
                        placeholder="예: 2026년 2분기 협업 운영 계획"
                        className="h-12 rounded-md border-background bg-background/70"
                        disabled={!currentUserId || isMutating}
                      />
                      <p className="text-xs text-text/55">
                        {editorState.title.trim().length}/{DOCUMENT_TITLE_MAX_LENGTH}
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
                        <p>`Tab` 들여쓰기</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md bg-background/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-headings text-lg text-text">결재선</h3>
                        <p className="text-sm text-text/60">
                          기본 3단계 레이블을 제공하고, 필요 시 단계를 추가할 수
                          있습니다.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-pill"
                        onClick={addApprovalStep}
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
                                updateApprovalStep(
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
                                updateApprovalStep(
                                  step.localId,
                                  "approverId",
                                  event.target.value,
                                )
                              }
                              disabled={isMutating || usersQuery.isLoading}
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
                              onClick={() => removeApprovalStep(step.localId)}
                              disabled={
                                editorState.approvalSteps.length === 1 || isMutating
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
                      <h3 className="font-headings text-lg text-text">공람 대상</h3>
                      <p className="text-sm text-text/60">
                        승인 권한은 없지만 문서를 열람해야 하는 사용자를
                        선택합니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableUsers.map((user) => {
                        const isSelected = editorState.ccRecipientIds.includes(user.id);

                        return (
                          <Button
                            key={user.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className="rounded-pill"
                            onClick={() => toggleCcRecipient(user.id)}
                            disabled={isMutating}
                          >
                            <UserPlus className="h-4 w-4" />
                            {renderUserName(user)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 rounded-md bg-background/60 p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: `**${selectedText || "굵은 텍스트"}**`,
                          }))
                        }
                      >
                        <Bold className="h-4 w-4" />
                        B
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: `*${selectedText || "기울임 텍스트"}*`,
                          }))
                        }
                      >
                        <Italic className="h-4 w-4" />I
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: `[${selectedText || "링크 텍스트"}](https://)`,
                          }))
                        }
                      >
                        <Link2 className="h-4 w-4" />
                        링크
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: applyLinePrefix(selectedText || "목록 항목", "- "),
                          }))
                        }
                      >
                        <List className="h-4 w-4" />
                        불릿
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: (selectedText || "목록 항목")
                              .split("\n")
                              .map((line, index) => `${index + 1}. ${line}`)
                              .join("\n"),
                          }))
                        }
                      >
                        <ListOrdered className="h-4 w-4" />
                        번호
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() =>
                          applyTextTransform((selectedText) => ({
                            text: applyLinePrefix(selectedText || "인용문", "> "),
                          }))
                        }
                      >
                        <Quote className="h-4 w-4" />
                        인용
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() => adjustHeadingLevel("increase")}
                      >
                        <Heading1 className="h-4 w-4" />
                        제목 +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-pill"
                        onClick={() => adjustHeadingLevel("decrease")}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        제목 -
                      </Button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={editorState.content}
                      onChange={(event) =>
                        updateEditorState("content", event.target.value)
                      }
                      onKeyDown={handleEditorKeyDown}
                      maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                      placeholder={`# 문서 초안\n\n필요한 내용을 Markdown으로 작성해 보세요.\n\n- 목적\n- 배경\n- 요청 사항`}
                      className="min-h-[360px] w-full rounded-md bg-background/80 px-4 py-4 font-body text-sm leading-7 text-text shadow-inner outline-none ring-1 ring-background transition focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!currentUserId || isMutating}
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
                        {editorState.title.trim() ? <h1>{editorState.title.trim()}</h1> : null}
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

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={!canSaveDraft}
                      className="rounded-pill px-6"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {selectedDocumentId ? "문서 저장" : "초안 생성"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-pill"
                      onClick={handleCancelEditing}
                      disabled={isMutating}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              ) : selectedDocumentQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  문서 상세를 불러오는 중입니다.
                </div>
              ) : selectedDocument ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-pill px-3 py-1 text-xs font-semibold",
                        statusBadgeClassMap[selectedDocument.status],
                      )}
                    >
                      {statusLabelMap[selectedDocument.status]}
                    </span>
                    <span className="text-xs text-text/55">
                      작성자 {renderUserName(selectedDocument.author)}
                    </span>
                    <span className="text-xs text-text/55">
                      수정 {formatDate(selectedDocument.updatedAt)}
                    </span>
                    {selectedDocument.currentStepLabel ? (
                      <span className="text-xs text-text/55">
                        현재 단계 {selectedDocument.currentStepLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="rounded-md bg-background/60 p-4">
                    <div className="mb-2 text-sm font-semibold text-text">
                      결재 타임라인
                    </div>
                    <div className="space-y-3">
                      {selectedDocument.approvalSteps.map((step) => (
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
                      {selectedDocument.ccRecipients.length === 0 ? (
                        <span className="text-sm text-text/55">공람자 없음</span>
                      ) : (
                        selectedDocument.ccRecipients.map((recipient) => (
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
                    <h1>{selectedDocument.title}</h1>
                    <MarkdownContent>
                      {selectedDocument.content || "_본문이 비어 있습니다._"}
                    </MarkdownContent>
                  </article>
                </div>
              ) : (
                <div className="rounded-md bg-background/60 px-5 py-8 text-center text-sm leading-6 text-text/60">
                  {selectedDocumentSummary
                    ? "문서를 선택하면 상세를 확인할 수 있습니다."
                    : "왼쪽 목록에서 문서를 선택하거나 새 문서를 작성해 보세요."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
