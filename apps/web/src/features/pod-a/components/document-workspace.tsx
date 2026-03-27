"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  adjustHeadingSelection,
  applyLinePrefix,
  continueMarkdownBlockOnEnter,
  indentSelectedLines,
  outdentSelectedLines,
  replaceSelection,
  type TextChange,
} from "@/features/pod-a/components/document-editor";
import { DocumentDetailDialog } from "@/features/pod-a/components/document-detail-dialog";
import { DocumentEditorDialog } from "@/features/pod-a/components/document-editor-dialog";
import {
  createEditorStateFromDocument,
  createEmptyEditorState,
  documentTemplateOptions,
  type DocumentTemplateId,
  type EditorStep,
  type EditorState,
  type StatusFilter,
} from "@/features/pod-a/components/document-workspace-shared";
import { DocumentWorkspaceShell } from "@/features/pod-a/components/document-workspace-shell";
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
  type DocumentScope,
} from "@/features/pod-a/services/document-schema";

type EditorHistoryEntry = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
};

function getErrorMessage(error: unknown) {
  if (error instanceof DocumentApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export function DocumentWorkspace() {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(
    null,
  );
  const historyRef = useRef<EditorHistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);

  const [currentUserId, setCurrentUserId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [scope, setScope] = useState<DocumentScope>("authored");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorDocumentId, setEditorDocumentId] = useState<string | null>(null);
  const [editorStep, setEditorStep] = useState<EditorStep>("template");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<DocumentTemplateId>("skip");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
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
    if (selectedDocumentId || (documentsQuery.data?.length ?? 0) === 0) {
      return;
    }

    setSelectedDocumentId(documentsQuery.data?.[0]?.id ?? null);
  }, [documentsQuery.data, selectedDocumentId]);

  useEffect(() => {
    if (!selectedDocumentId && isDetailOpen) {
      setIsDetailOpen(false);
    }
  }, [isDetailOpen, selectedDocumentId]);

  const queryErrorMessage = useMemo(
    () =>
      getErrorMessage(documentsQuery.error) ??
      getErrorMessage(selectedDocumentQuery.error) ??
      getErrorMessage(usersQuery.error),
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

  function openDetail(documentId: string) {
    setSelectedDocumentId(documentId);
    setIsDetailOpen(true);
  }

  function resetEditorHistory(
    content: string,
    selectionStart = 0,
    selectionEnd = selectionStart,
  ) {
    historyRef.current = [
      {
        content,
        selectionStart,
        selectionEnd,
      },
    ];
    historyIndexRef.current = 0;
  }

  function openEditorForCreate() {
    setScope("authored");
    setStatusFilter("ALL");
    setIsDetailOpen(false);
    setEditorDocumentId(null);
    setEditorStep("template");
    setSelectedTemplateId("skip");
    setIsPreviewVisible(false);
    setEditorState(createEmptyEditorState());
    resetEditorHistory("");
    setIsEditorOpen(true);
  }

  function openEditorForDocument(documentId: string) {
    const document = selectedDocumentQuery.data;

    if (
      !document ||
      document.id !== documentId ||
      !document.permissions.canEdit
    ) {
      return;
    }

    setEditorDocumentId(document.id);
    setEditorStep("content");
    setSelectedTemplateId("skip");
    setIsPreviewVisible(false);
    setEditorState(createEditorStateFromDocument(document));
    resetEditorHistory(document.content);
    setIsDetailOpen(false);
    setIsEditorOpen(true);
  }

  function closeEditor(reopenDetail: boolean) {
    setIsEditorOpen(false);
    setEditorDocumentId(null);
    setEditorStep("template");
    setSelectedTemplateId("skip");
    setIsPreviewVisible(false);

    if (reopenDetail && selectedDocumentId) {
      setIsDetailOpen(true);
    }
  }

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setScope("authored");
      setSelectedDocumentId(document.id);
      setIsEditorOpen(false);
      setEditorDocumentId(null);
      setIsDetailOpen(true);
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
      setIsEditorOpen(false);
      setEditorDocumentId(null);
      setIsDetailOpen(true);
      invalidateDocumentQueries(document.id);
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitDocument,
    onSuccess: (document) => {
      queryClient.setQueryData(["document", document.id], document);
      setSelectedDocumentId(document.id);
      setIsDetailOpen(true);
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
      setIsDetailOpen(true);
      invalidateDocumentQueries(document.id);
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending ||
    approvalMutation.isPending;

  const mutationErrorMessage =
    getErrorMessage(createMutation.error) ??
    getErrorMessage(updateMutation.error) ??
    getErrorMessage(submitMutation.error) ??
    getErrorMessage(approvalMutation.error);

  const availableUsers = (usersQuery.data ?? []).filter(
    (user) => user.id !== currentUserId,
  );

  const selectedDocument = selectedDocumentQuery.data ?? null;

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
  const canProceedFromContentStep =
    editorState.title.trim().length > 0 &&
    editorState.title.trim().length <= DOCUMENT_TITLE_MAX_LENGTH &&
    editorState.content.length <= DOCUMENT_CONTENT_MAX_LENGTH;

  function updateEditorState<K extends keyof EditorState>(
    key: K,
    value: EditorState[K],
  ) {
    setEditorState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function scheduleTextareaSelection(start: number, end: number) {
    pendingSelectionRef.current = { start, end };

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      const pendingSelection = pendingSelectionRef.current;

      if (!textarea || !pendingSelection) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(pendingSelection.start, pendingSelection.end);
      pendingSelectionRef.current = null;
    });
  }

  function pushEditorHistory(
    content: string,
    selectionStart: number,
    selectionEnd: number,
  ) {
    const currentSnapshot = historyRef.current[historyIndexRef.current];

    if (
      currentSnapshot?.content === content &&
      currentSnapshot.selectionStart === selectionStart &&
      currentSnapshot.selectionEnd === selectionEnd
    ) {
      return;
    }

    const nextHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );

    nextHistory.push({
      content,
      selectionStart,
      selectionEnd,
    });
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  }

  function applyEditorChange(change: TextChange) {
    updateEditorState("content", change.nextValue);
    pushEditorHistory(
      change.nextValue,
      change.selectionStart,
      change.selectionEnd,
    );
    scheduleTextareaSelection(change.selectionStart, change.selectionEnd);
  }

  function restoreHistorySnapshot(direction: "undo" | "redo") {
    const nextIndex =
      direction === "undo"
        ? historyIndexRef.current - 1
        : historyIndexRef.current + 1;
    const snapshot = historyRef.current[nextIndex];

    if (!snapshot) {
      return;
    }

    historyIndexRef.current = nextIndex;
    updateEditorState("content", snapshot.content);
    scheduleTextareaSelection(snapshot.selectionStart, snapshot.selectionEnd);
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
    const change = replaceSelection(
      editorState.content,
      selectionStart,
      selectionEnd,
      transform,
    );

    applyEditorChange(change);
  }

  function handleIndentSelection() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const change = indentSelectedLines(
      editorState.content,
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    applyEditorChange(change);
  }

  function handleOutdentSelection() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const change = outdentSelectedLines(
      editorState.content,
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    applyEditorChange(change);
  }

  function adjustHeadingLevel(direction: "increase" | "decrease") {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const change = adjustHeadingSelection(
      editorState.content,
      textarea.selectionStart,
      textarea.selectionEnd,
      direction,
    );

    applyEditorChange(change);
  }

  function handleEditorContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateEditorState("content", event.target.value);
    pushEditorHistory(
      event.target.value,
      event.target.selectionStart,
      event.target.selectionEnd,
    );
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isMeta = event.metaKey || event.ctrlKey;

    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        handleOutdentSelection();
        return;
      }

      handleIndentSelection();
      return;
    }

    if (event.key === "Enter") {
      const change = continueMarkdownBlockOnEnter(
        editorState.content,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
      );

      if (!change) {
        return;
      }

      event.preventDefault();
      applyEditorChange(change);
      return;
    }

    if (!isMeta) {
      return;
    }

    const normalizedKey = event.key.toLowerCase();

    if (normalizedKey === "v" && event.shiftKey) {
      event.preventDefault();
      setIsPreviewVisible((current) => !current);
      return;
    }

    if (normalizedKey === "z") {
      event.preventDefault();
      restoreHistorySnapshot(event.shiftKey ? "redo" : "undo");
      return;
    }

    if (normalizedKey === "y") {
      event.preventDefault();
      restoreHistorySnapshot("redo");
      return;
    }

    if (normalizedKey === "b") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "굵은 텍스트";

        return {
          text: `**${text}**`,
          selectionStart: selectedText ? undefined : 2,
          selectionEnd: selectedText ? undefined : 2 + text.length,
        };
      });
      return;
    }

    if (normalizedKey === "i") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "기울임 텍스트";

        return {
          text: `*${text}*`,
          selectionStart: selectedText ? undefined : 1,
          selectionEnd: selectedText ? undefined : 1 + text.length,
        };
      });
      return;
    }

    if (normalizedKey === "k") {
      event.preventDefault();
      applyTextTransform((selectedText) => {
        const text = selectedText || "링크 텍스트";

        return {
          text: `[${text}](https://)`,
          selectionStart: selectedText ? undefined : 1,
          selectionEnd: selectedText ? undefined : 1 + text.length,
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

  useEffect(() => {
    if (historyIndexRef.current !== -1 || !isEditorOpen) {
      return;
    }

    resetEditorHistory(editorState.content);
  }, [editorState.content, isEditorOpen]);

  function handleSaveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUserId || !canSaveDraft) {
      return;
    }

    const payload = {
      title: editorState.title,
      content: editorState.content,
      approvalSteps: editorState.approvalSteps.map(
        ({ stepLabel, approverId }) => ({
          stepLabel,
          approverId,
        }),
      ),
      ccRecipientIds: editorState.ccRecipientIds,
    };

    if (editorDocumentId) {
      updateMutation.mutate({
        documentId: editorDocumentId,
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
    if (!selectedDocument?.permissions.canApprove || !selectedDocumentId) {
      return;
    }

    approvalMutation.mutate({
      documentId: selectedDocumentId,
      action,
    });
  }

  function handleCancelEditing() {
    if (isMutating) {
      return;
    }

    const reopenDetail = Boolean(editorDocumentId && selectedDocumentId);

    if (editorDocumentId && selectedDocument) {
      setEditorState(createEditorStateFromDocument(selectedDocument));
      resetEditorHistory(selectedDocument.content);
    } else {
      setEditorState(createEmptyEditorState());
      resetEditorHistory("");
    }

    closeEditor(reopenDetail);
  }

  function handleEditorStepChange(nextStep: EditorStep) {
    if (nextStep === "workflow" && !canProceedFromContentStep) {
      return;
    }

    setEditorStep(nextStep);
  }

  function handleTemplateSelect(templateId: DocumentTemplateId) {
    const template = documentTemplateOptions.find(
      (item) => item.id === templateId,
    );

    if (!template) {
      return;
    }

    setSelectedTemplateId(templateId);
    setIsPreviewVisible(false);
    setEditorState((current) => ({
      ...current,
      title: template.title,
      content: template.content,
    }));
    resetEditorHistory(template.content);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DocumentWorkspaceShell
        currentUserId={currentUserId}
        isMutating={isMutating}
        isAuthLoading={isAuthLoading}
        authMessage={authMessage}
        errorMessage={queryErrorMessage}
        scope={scope}
        statusFilter={statusFilter}
        documents={documentsQuery.data ?? []}
        isDocumentsLoading={documentsQuery.isLoading}
        isDocumentsError={documentsQuery.isError}
        isRefreshing={documentsQuery.isFetching}
        selectedDocumentId={selectedDocumentId}
        onNewDocument={openEditorForCreate}
        onRefresh={() => {
          void documentsQuery.refetch();
          if (selectedDocumentId) {
            void selectedDocumentQuery.refetch();
          }
        }}
        onScopeChange={setScope}
        onStatusFilterChange={setStatusFilter}
        onSelectDocument={openDetail}
      />

      <DocumentDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailOpen(false);
          }
        }}
        document={selectedDocument}
        isLoading={selectedDocumentQuery.isLoading}
        errorMessage={queryErrorMessage ?? mutationErrorMessage}
        onEdit={() => {
          if (!selectedDocumentId) {
            return;
          }

          openEditorForDocument(selectedDocumentId);
        }}
        onSubmit={handleSubmitDocument}
        onApprove={() => handleApprovalAction("APPROVE")}
        onReject={() => handleApprovalAction("REJECT")}
        submitPending={submitMutation.isPending}
        approvalPending={approvalMutation.isPending}
      />

      <DocumentEditorDialog
        isOpen={isEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelEditing();
          }
        }}
        mode={editorDocumentId ? "edit" : "create"}
        currentUserId={currentUserId}
        isMutating={isMutating}
        canSaveDraft={canSaveDraft}
        canProceedFromContentStep={canProceedFromContentStep}
        errorMessage={mutationErrorMessage}
        editorState={editorState}
        availableUsers={availableUsers}
        isUsersLoading={usersQuery.isLoading}
        textareaRef={textareaRef}
        currentStep={editorStep}
        selectedTemplateId={selectedTemplateId}
        isPreviewVisible={isPreviewVisible}
        onStepChange={handleEditorStepChange}
        onTemplateSelect={handleTemplateSelect}
        onTogglePreview={() => setIsPreviewVisible((current) => !current)}
        onSubmit={handleSaveDocument}
        onCancel={handleCancelEditing}
        onTitleChange={(value) => updateEditorState("title", value)}
        onUpdateApprovalStep={updateApprovalStep}
        onAddApprovalStep={addApprovalStep}
        onRemoveApprovalStep={removeApprovalStep}
        onToggleCcRecipient={toggleCcRecipient}
        onContentChange={handleEditorContentChange}
        onContentKeyDown={handleEditorKeyDown}
        onApplyBold={() =>
          applyTextTransform((selectedText) => {
            const text = selectedText || "굵은 텍스트";

            return {
              text: `**${text}**`,
              selectionStart: selectedText ? undefined : 2,
              selectionEnd: selectedText ? undefined : 2 + text.length,
            };
          })
        }
        onApplyItalic={() =>
          applyTextTransform((selectedText) => {
            const text = selectedText || "기울임 텍스트";

            return {
              text: `*${text}*`,
              selectionStart: selectedText ? undefined : 1,
              selectionEnd: selectedText ? undefined : 1 + text.length,
            };
          })
        }
        onApplyLink={() =>
          applyTextTransform((selectedText) => {
            const text = selectedText || "링크 텍스트";

            return {
              text: `[${text}](https://)`,
              selectionStart: selectedText ? undefined : 1,
              selectionEnd: selectedText ? undefined : 1 + text.length,
            };
          })
        }
        onApplyBulletList={() =>
          applyTextTransform((selectedText) => ({
            text: applyLinePrefix(selectedText || "목록 항목", "- "),
          }))
        }
        onApplyOrderedList={() =>
          applyTextTransform((selectedText) => ({
            text: (selectedText || "목록 항목")
              .split("\n")
              .map((line, index) => `${index + 1}. ${line}`)
              .join("\n"),
          }))
        }
        onApplyQuote={() =>
          applyTextTransform((selectedText) => ({
            text: applyLinePrefix(selectedText || "인용문", "> "),
          }))
        }
        onIncreaseHeading={() => adjustHeadingLevel("increase")}
        onDecreaseHeading={() => adjustHeadingLevel("decrease")}
      />
    </div>
  );
}
