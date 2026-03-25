import { z } from "zod";

export const DOCUMENT_TITLE_MAX_LENGTH = 120;
export const DOCUMENT_CONTENT_MAX_LENGTH = 20000;

export const documentStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const createDocumentInputSchema = z.object({
  authorId: z.string().uuid("유효한 작성자 ID가 필요합니다."),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(
      DOCUMENT_TITLE_MAX_LENGTH,
      `제목은 ${DOCUMENT_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`
    ),
  content: z
    .string()
    .max(
      DOCUMENT_CONTENT_MAX_LENGTH,
      `본문은 ${DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}자 이하로 입력해 주세요.`
    ),
});

export const updateDocumentInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(
      DOCUMENT_TITLE_MAX_LENGTH,
      `제목은 ${DOCUMENT_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`
    ),
  content: z
    .string()
    .max(
      DOCUMENT_CONTENT_MAX_LENGTH,
      `본문은 ${DOCUMENT_CONTENT_MAX_LENGTH.toLocaleString()}자 이하로 입력해 주세요.`
    ),
});

const rawDocumentSchema = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable(),
  status: documentStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export const documentSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  status: documentStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const documentListResponseSchema = z.object({
  documents: z.array(documentSchema),
});

export const createDocumentResponseSchema = z.object({
  document: documentSchema,
});

export function normalizeDocumentRow(row: unknown) {
  const parsedRow = rawDocumentSchema.parse(row);

  return documentSchema.parse({
    id: parsedRow.id,
    authorId: parsedRow.author_id,
    title: parsedRow.title,
    content: parsedRow.content ?? "",
    status: parsedRow.status,
    createdAt: parsedRow.created_at,
    updatedAt: parsedRow.updated_at,
  });
}

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;
export type DocumentRecord = z.infer<typeof documentSchema>;
