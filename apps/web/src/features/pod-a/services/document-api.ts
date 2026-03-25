import {
  createDocumentInputSchema,
  createDocumentResponseSchema,
  documentListResponseSchema,
  updateDocumentStatusInputSchema,
  updateDocumentInputSchema,
  type CreateDocumentInput,
  type DocumentRecord,
  type DocumentStatus,
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

export async function fetchDocuments(
  status?: DocumentStatus
): Promise<DocumentRecord[]> {
  const queryString = status
    ? `?${new URLSearchParams({ status }).toString()}`
    : "";
  const response = await fetch(`/api/documents${queryString}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson(response);

  return documentListResponseSchema.parse(data).documents;
}

export async function createDocument(
  input: CreateDocumentInput
): Promise<DocumentRecord> {
  const payload = createDocumentInputSchema.parse(input);
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  return createDocumentResponseSchema.parse(data).document;
}

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput
): Promise<DocumentRecord> {
  const payload = updateDocumentInputSchema.parse(input);
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  return createDocumentResponseSchema.parse(data).document;
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
): Promise<DocumentRecord> {
  const payload = updateDocumentStatusInputSchema.parse({ status });
  const response = await fetch(`/api/documents/${documentId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  return createDocumentResponseSchema.parse(data).document;
}
