"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCheck,
  FileText,
  Inbox,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  createDocument,
  DocumentApiError,
  fetchDocuments,
  updateDocument,
  updateDocumentStatus,
} from "@/features/pod-a/services/document-api";
import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  type DocumentRecord,
  type DocumentStatus,
} from "@/features/pod-a/services/document-schema";

type EditorMode = "create" | "edit";
type InboxFilter = "ALL" | DocumentStatus;

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

const inboxFilters: Array<{ value: InboxFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "결재 대기" },
  { value: "DRAFT", label: "초안" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
];

function getStatusActions(status: DocumentStatus) {
  switch (status) {
    case "DRAFT":
      return [
        { nextStatus: "PENDING" as const, label: "결재 요청", icon: Send },
      ];
    case "PENDING":
      return [
        { nextStatus: "APPROVED" as const, label: "승인", icon: CheckCheck },
        { nextStatus: "REJECTED" as const, label: "반려", icon: XCircle },
      ];
    case "REJECTED":
      return [
        { nextStatus: "PENDING" as const, label: "재결재 요청", icon: Send },
      ];
    default:
      return [];
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DocumentWorkspace() {
  const queryClient = useQueryClient();
  const [authorId, setAuthorId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("PENDING");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
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

      setAuthorId(user.id);
      setAuthMessage("");
      setIsAuthLoading(false);
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const documentsQuery = useQuery({
    queryKey: ["documents", authorId],
    queryFn: () => fetchDocuments(),
    enabled: Boolean(authorId),
  });

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (createdDocument) => {
      queryClient.setQueryData<DocumentRecord[]>(
        ["documents", authorId],
        (currentDocuments = []) => [createdDocument, ...currentDocuments],
      );
      setSelectedDocumentId(createdDocument.id);
      setTitle(createdDocument.title);
      setContent(createdDocument.content);
      setEditorMode("edit");
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({
      documentId,
      nextTitle,
      nextContent,
    }: {
      documentId: string;
      nextTitle: string;
      nextContent: string;
    }) =>
      updateDocument(documentId, { title: nextTitle, content: nextContent }),
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData<DocumentRecord[]>(
        ["documents", authorId],
        (currentDocuments = []) =>
          currentDocuments.map((document) =>
            document.id === updatedDocument.id ? updatedDocument : document,
          ),
      );
      setSelectedDocumentId(updatedDocument.id);
      setTitle(updatedDocument.title);
      setContent(updatedDocument.content);
      setEditorMode("edit");
    },
  });

  const updateDocumentStatusMutation = useMutation({
    mutationFn: ({
      documentId,
      nextStatus,
    }: {
      documentId: string;
      nextStatus: DocumentStatus;
    }) => updateDocumentStatus(documentId, nextStatus),
    onMutate: async ({ documentId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["documents", authorId] });

      const previousDocuments =
        queryClient.getQueryData<DocumentRecord[]>(["documents", authorId]) ??
        [];

      queryClient.setQueryData<DocumentRecord[]>(
        ["documents", authorId],
        previousDocuments.map((document) =>
          document.id === documentId
            ? {
                ...document,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
              }
            : document,
        ),
      );

      return { previousDocuments };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        ["documents", authorId],
        context.previousDocuments,
      );
    },
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData<DocumentRecord[]>(
        ["documents", authorId],
        (currentDocuments = []) =>
          currentDocuments.map((document) =>
            document.id === updatedDocument.id ? updatedDocument : document,
          ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["documents", authorId],
      });
    },
  });

  useEffect(() => {
    if (selectedDocumentId || !documentsQuery.data?.length) {
      return;
    }

    startEditingDocument(documentsQuery.data[0]);
  }, [documentsQuery.data, selectedDocumentId]);

  const selectedDocument =
    documentsQuery.data?.find(
      (document) => document.id === selectedDocumentId,
    ) ?? null;
  const filteredDocuments =
    inboxFilter === "ALL"
      ? (documentsQuery.data ?? [])
      : (documentsQuery.data ?? []).filter(
          (document) => document.status === inboxFilter,
        );

  const isSubmitting =
    createDocumentMutation.isPending || updateDocumentMutation.isPending;

  const submitError =
    createDocumentMutation.error instanceof DocumentApiError
      ? createDocumentMutation.error
      : updateDocumentMutation.error instanceof DocumentApiError
        ? updateDocumentMutation.error
        : updateDocumentStatusMutation.error instanceof DocumentApiError
          ? updateDocumentStatusMutation.error
          : null;

  const canSubmit =
    Boolean(authorId) &&
    title.trim().length > 0 &&
    title.trim().length <= DOCUMENT_TITLE_MAX_LENGTH &&
    content.length <= DOCUMENT_CONTENT_MAX_LENGTH &&
    !isSubmitting;

  function resetEditor() {
    setEditorMode("create");
    setTitle("");
    setContent("");
  }

  function startEditingDocument(document: DocumentRecord) {
    setSelectedDocumentId(document.id);
    setEditorMode("edit");
    setTitle(document.title);
    setContent(document.content);
  }

  function handleStatusChange(documentId: string, nextStatus: DocumentStatus) {
    updateDocumentStatusMutation.mutate({ documentId, nextStatus });
  }

  function handleSubmitDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authorId) {
      return;
    }

    if (editorMode === "edit" && selectedDocumentId) {
      updateDocumentMutation.mutate({
        documentId: selectedDocumentId,
        nextTitle: title,
        nextContent: content,
      });
      return;
    }

    createDocumentMutation.mutate({
      authorId,
      title,
      content,
    });
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-md bg-surface px-8 py-7 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {/* <div className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-2 text-sm font-headings font-medium text-primary">
            <FileText className="h-4 w-4" />
            Pod A Part 2
          </div> */}
          <div className="space-y-2">
            <h1 className="text-4xl font-headings font-semibold tracking-tight text-text">
              결재 상태를 바꾸고 승인 흐름까지 이어가세요.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-text/80">
              문서 작성, 상태 변경 API, 결재 인박스, 승인 후 지식 인덱싱
              연결까지 한 화면에서 관리할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="rounded-md bg-background/80 px-5 py-4 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <ShieldCheck className="h-4 w-4 text-primary" />
            본인 문서만 조회
          </div>
          <p className="mt-1 text-sm text-text/70">
            API는 로그인 사용자와 `author_id` 일치 여부를 검사합니다.
          </p>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-md border-none bg-surface shadow-soft">
          <CardHeader className="space-y-2 border-b border-background/70 bg-background/40">
            <CardTitle className="text-2xl font-headings text-text">
              {editorMode === "edit" ? "문서 수정" : "새 문서 작성"}
            </CardTitle>
            <CardDescription className="font-body text-text/70">
              제목과 Markdown 본문을 입력하고 저장하거나 기존 문서를 수정할 수
              있습니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmitDocument}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-background/55 px-4 py-3">
                <div className="text-sm text-text/70">
                  {editorMode === "edit"
                    ? "선택한 문서를 편집 중입니다."
                    : "새로운 초안을 작성 중입니다."}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-pill"
                  onClick={resetEditor}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />새 초안
                </Button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="document-title"
                  className="text-sm font-bold text-text"
                >
                  제목
                </label>
                <Input
                  id="document-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={DOCUMENT_TITLE_MAX_LENGTH}
                  placeholder="예: 2026년 2분기 협업 운영 계획"
                  className="h-12 rounded-md border-background bg-background/70"
                  disabled={!authorId || isSubmitting}
                />
                <p className="text-xs text-text/55">
                  {title.trim().length}/{DOCUMENT_TITLE_MAX_LENGTH}
                </p>
              </div>

              <Tabs defaultValue="editor" className="space-y-4">
                <TabsList className="rounded-pill bg-background/80 p-1">
                  <TabsTrigger value="editor" className="rounded-pill">
                    에디터
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-pill">
                    미리보기
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-0">
                  <div className="space-y-2">
                    <label
                      htmlFor="document-content"
                      className="text-sm font-bold text-text"
                    >
                      본문
                    </label>
                    <textarea
                      id="document-content"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      maxLength={DOCUMENT_CONTENT_MAX_LENGTH}
                      placeholder={`# 문서 초안\n\n필요한 내용을 Markdown으로 작성해 보세요.\n\n- 목적\n- 배경\n- 요청 사항`}
                      className="min-h-[360px] w-full rounded-md bg-background/80 px-4 py-4 font-body text-sm leading-7 text-text shadow-inner outline-none ring-1 ring-background transition focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!authorId || isSubmitting}
                    />
                    <div className="flex items-center justify-between text-xs text-text/55">
                      <span>Markdown 형식으로 작성됩니다.</span>
                      <span>
                        {content.length}/
                        {DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[360px] rounded-md bg-background/70 p-6 shadow-inner">
                    {title.trim() || content.trim() ? (
                      <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
                        {title.trim() ? <h1>{title.trim()}</h1> : null}
                        <MarkdownContent>
                          {content || "_본문이 비어 있습니다._"}
                        </MarkdownContent>
                      </article>
                    ) : (
                      <div className="flex min-h-[312px] items-center justify-center rounded-md border border-dashed border-primary/20 bg-surface/60 px-6 text-center text-sm leading-6 text-text/60">
                        제목과 본문을 입력하면 이 영역에 문서 미리보기가
                        표시됩니다.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-3">
                {authMessage ? (
                  <p className="rounded-md bg-secondary/20 px-4 py-3 text-sm text-text">
                    {authMessage}
                  </p>
                ) : null}

                {submitError ? (
                  <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitError.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="h-12 rounded-pill px-6 font-headings text-base shadow-soft"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editorMode === "edit" ? (
                      <PencilLine className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editorMode === "edit" ? "문서 수정 저장" : "문서 저장"}
                  </Button>
                  <p className="text-sm text-text/60">
                    {editorMode === "edit"
                      ? "수정해도 현재 상태 값은 유지됩니다."
                      : "생성 시 기본 상태는 `DRAFT`입니다."}
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="rounded-md border-none bg-surface shadow-soft">
            <CardHeader className="border-b border-background/70 bg-background/35">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-headings text-text">
                    결재 인박스
                  </CardTitle>
                  <CardDescription className="font-body text-text/70">
                    상태별 문서를 모아 보고, 버튼으로 바로 결재 흐름을 진행할 수
                    있습니다.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => documentsQuery.refetch()}
                  disabled={!authorId || documentsQuery.isFetching}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      documentsQuery.isFetching ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {inboxFilters.map((filter) => {
                  const count =
                    filter.value === "ALL"
                      ? (documentsQuery.data?.length ?? 0)
                      : (documentsQuery.data?.filter(
                          (document) => document.status === filter.value,
                        ).length ?? 0);
                  const isActive = inboxFilter === filter.value;

                  return (
                    <Button
                      key={filter.value}
                      type="button"
                      variant={isActive ? "default" : "ghost"}
                      className="rounded-pill"
                      onClick={() => setInboxFilter(filter.value)}
                    >
                      <Inbox className="h-4 w-4" />
                      {filter.label}
                      <span
                        className={`rounded-pill px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {count}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {isAuthLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  사용자 정보를 확인하고 있습니다.
                </div>
              ) : null}

              {!isAuthLoading && documentsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-text/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  문서를 불러오는 중입니다.
                </div>
              ) : null}

              {!isAuthLoading && documentsQuery.isError ? (
                <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {documentsQuery.error instanceof Error
                    ? documentsQuery.error.message
                    : "문서 목록을 가져오지 못했습니다."}
                </p>
              ) : null}

              {!isAuthLoading &&
              !documentsQuery.isLoading &&
              !documentsQuery.isError &&
              filteredDocuments.length === 0 ? (
                <div className="rounded-md bg-background/60 px-5 py-8 text-center text-sm leading-6 text-text/60">
                  현재 필터에 해당하는 문서가 없습니다. 왼쪽 에디터에서 초안을
                  만들거나 다른 상태 탭을 확인해 보세요.
                </div>
              ) : null}

              <div className="space-y-3">
                {filteredDocuments.map((document) => {
                  const isSelected = document.id === selectedDocumentId;
                  const statusActions = getStatusActions(document.status);
                  const isStatusUpdating =
                    updateDocumentStatusMutation.isPending &&
                    updateDocumentStatusMutation.variables?.documentId ===
                      document.id;

                  return (
                    <div
                      key={document.id}
                      className={`w-full rounded-md px-4 py-4 text-left transition-all ${
                        isSelected
                          ? "bg-primary text-white shadow-soft"
                          : "bg-background/70 text-text hover:bg-background"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => startEditingDocument(document)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-headings text-base font-semibold">
                              {document.title}
                            </p>
                            <p
                              className={`mt-1 text-xs ${
                                isSelected ? "text-white/80" : "text-text/55"
                              }`}
                            >
                              {formatDate(document.updatedAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : statusBadgeClassMap[document.status]
                            }`}
                          >
                            {statusLabelMap[document.status]}
                          </span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-white/85" : "text-text/55"
                            }`}
                          >
                            클릭하여 상세 보기
                          </span>
                        </div>
                      </button>

                      {statusActions.length ? (
                        <div
                          className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${
                            isSelected
                              ? "border-white/20"
                              : "border-background/70"
                          }`}
                        >
                          {statusActions.map((action) => {
                            const ActionIcon = action.icon;

                            return (
                              <Button
                                key={action.nextStatus}
                                type="button"
                                variant={
                                  action.nextStatus === "REJECTED"
                                    ? "destructive"
                                    : isSelected
                                      ? "secondary"
                                      : "outline"
                                }
                                className="rounded-pill"
                                disabled={isStatusUpdating}
                                onClick={() =>
                                  handleStatusChange(
                                    document.id,
                                    action.nextStatus,
                                  )
                                }
                              >
                                {isStatusUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ActionIcon className="h-4 w-4" />
                                )}
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-none bg-surface shadow-soft">
            <CardHeader className="border-b border-background/70 bg-background/35">
              <CardTitle className="text-2xl font-headings text-text">
                선택한 문서
              </CardTitle>
              <CardDescription className="font-body text-text/70">
                저장된 문서를 확인하고 현재 상태에 맞는 다음 액션을 수행합니다.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {selectedDocument ? (
                <article className="prose prose-slate max-w-none font-body prose-headings:font-headings prose-headings:text-text prose-p:text-text prose-li:text-text prose-strong:text-text">
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadgeClassMap[selectedDocument.status]}`}
                    >
                      {statusLabelMap[selectedDocument.status]}
                    </span>
                    <span className="text-xs text-text/55">
                      생성 {formatDate(selectedDocument.createdAt)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="ml-auto rounded-pill text-primary"
                      onClick={() => startEditingDocument(selectedDocument)}
                    >
                      <PencilLine className="h-4 w-4" />이 문서 편집
                    </Button>
                  </div>
                  {getStatusActions(selectedDocument.status).length ? (
                    <div className="mb-6 flex flex-wrap gap-2 text-primary">
                      {getStatusActions(selectedDocument.status).map(
                        (action) => {
                          const ActionIcon = action.icon;
                          const isStatusUpdating =
                            updateDocumentStatusMutation.isPending &&
                            updateDocumentStatusMutation.variables
                              ?.documentId === selectedDocument.id;

                          return (
                            <Button
                              key={action.nextStatus}
                              type="button"
                              variant={
                                action.nextStatus === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="rounded-pill"
                              disabled={isStatusUpdating}
                              onClick={() =>
                                handleStatusChange(
                                  selectedDocument.id,
                                  action.nextStatus,
                                )
                              }
                            >
                              {isStatusUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ActionIcon className="h-4 w-4" />
                              )}
                              {action.label}
                            </Button>
                          );
                        },
                      )}
                    </div>
                  ) : null}
                  <h1>{selectedDocument.title}</h1>
                  <MarkdownContent>
                    {selectedDocument.content || "_본문이 비어 있습니다._"}
                  </MarkdownContent>
                </article>
              ) : (
                <div className="rounded-md bg-background/60 px-5 py-8 text-center text-sm leading-6 text-text/60">
                  오른쪽 목록에서 문서를 선택하면 저장된 Markdown 내용을 확인할
                  수 있습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
