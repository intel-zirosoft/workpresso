import {
  approvalActionInputSchema,
  createDocumentInputSchema,
  documentListResponseSchema,
  documentResponseSchema,
  documentScopeSchema,
  documentStatusSchema,
  updateDocumentInputSchema,
  userListResponseSchema,
  type ApprovalActionInput,
  type CreateDocumentInput,
  type DocumentDetail,
  type DocumentScope,
  type DocumentStatus,
  type DocumentSummary,
  type DocumentUser,
  type UpdateDocumentInput,
} from "@/features/pod-a/services/document-schema";

export class DocumentApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentApiError";
  }
}

async function parseJson(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DocumentApiError(data?.message ?? "문서 요청에 실패했습니다.");
  }

  return data;
}

function buildListQueryString(options?: {
  scope?: DocumentScope;
  status?: DocumentStatus;
}) {
  const params = new URLSearchParams();

  if (options?.scope) {
    params.set("scope", documentScopeSchema.parse(options.scope));
  }

  if (options?.status) {
    params.set("status", documentStatusSchema.parse(options.status));
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function fetchDocuments(options?: {
  scope?: DocumentScope;
  status?: DocumentStatus;
}): Promise<DocumentSummary[]> {
  const response = await fetch(
    `/api/documents${buildListQueryString(options ?? { scope: "authored" })}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
  const data = await parseJson(response);

  return documentListResponseSchema.parse(data).documents;
}

export async function fetchDocument(documentId: string): Promise<DocumentDetail> {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await parseJson(response);

  return documentResponseSchema.parse(data).document;
}

export async function fetchDocumentUsers(): Promise<DocumentUser[]> {
  const response = await fetch("/api/users", {
    method: "GET",
    cache: "no-store",
  });
  const data = await parseJson(response);

  return userListResponseSchema.parse(data).users;
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<DocumentDetail> {
  const payload = createDocumentInputSchema.parse(input);
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  return documentResponseSchema.parse(data).document;
}

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentDetail> {
  const payload = updateDocumentInputSchema.parse(input);
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  return documentResponseSchema.parse(data).document;
}

export async function submitDocument(documentId: string): Promise<DocumentDetail> {
  const response = await fetch(`/api/documents/${documentId}/submit`, {
    method: "POST",
  });
  const data = await parseJson(response);

  return documentResponseSchema.parse(data).document;
}

export async function actOnDocument(
  documentId: string,
  input: ApprovalActionInput,
): Promise<DocumentDetail> {
  const payload = approvalActionInputSchema.parse(input);
  const response = await fetch(`/api/documents/${documentId}/approval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);

  return documentResponseSchema.parse(data).document;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new DocumentApiError(data?.message ?? "문서를 삭제하지 못했습니다.");
  }
}
