import { describe, expect, it } from "vitest";

import {
  DOCUMENT_CONTENT_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
  createDocumentInputSchema,
  normalizeDocumentRow,
  updateDocumentStatusInputSchema,
} from "@/features/pod-a/services/document-schema";

describe("document-schema", () => {
  it("trims the title when creating a document", () => {
    const parsed = createDocumentInputSchema.parse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "  분기 운영 계획  ",
      content: "본문",
    });

    expect(parsed.title).toBe("분기 운영 계획");
  });

  it("rejects content longer than the schema limit", () => {
    const parsed = createDocumentInputSchema.safeParse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "문서 제목",
      content: "a".repeat(DOCUMENT_CONTENT_MAX_LENGTH + 1),
    });

    expect(parsed.success).toBe(false);
  });

  it("normalizes a nullable document row into the client contract", () => {
    const document = normalizeDocumentRow({
      id: "00000000-0000-4000-8000-000000000001",
      author_id: "00000000-0000-4000-8000-000000000002",
      title: "운영 계획",
      content: null,
      status: "DRAFT",
      created_at: "2026-03-26T00:00:00.000Z",
      updated_at: "2026-03-26T01:00:00.000Z",
      deleted_at: null,
    });

    expect(document).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      authorId: "00000000-0000-4000-8000-000000000002",
      title: "운영 계획",
      content: "",
      status: "DRAFT",
      createdAt: "2026-03-26T00:00:00.000Z",
      updatedAt: "2026-03-26T01:00:00.000Z",
    });
  });

  it("accepts only supported workflow statuses", () => {
    expect(
      updateDocumentStatusInputSchema.safeParse({ status: "APPROVED" }).success
    ).toBe(true);
    expect(
      updateDocumentStatusInputSchema.safeParse({ status: "ARCHIVED" }).success
    ).toBe(false);
  });

  it("keeps title validation aligned with the shared schema limit", () => {
    const parsed = createDocumentInputSchema.safeParse({
      authorId: "00000000-0000-4000-8000-000000000001",
      title: "a".repeat(DOCUMENT_TITLE_MAX_LENGTH + 1),
      content: "",
    });

    expect(parsed.success).toBe(false);
  });
});
