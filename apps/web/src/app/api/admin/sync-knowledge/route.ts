import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { upsertKnowledgeSource } from "@/features/pod-c/services/knowledge-sync";

// Node.js 런타임 사용 (파일 시스템 접근 필요)
export const runtime = "nodejs";

function createDeterministicKnowledgeSourceId(seed: string) {
  const hash = createHash("sha1").update(seed).digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, "0")}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

export async function POST() {
  try {
    const kbPath = path.join(process.cwd(), "src/features/pod-c/knowledge-base");
    const files = fs.readdirSync(kbPath).filter((file) => file.endsWith(".md"));

    for (const fileName of files) {
      const content = fs.readFileSync(path.join(kbPath, fileName), "utf-8");

      await upsertKnowledgeSource({
        sourceType: "DOCUMENTS",
        sourceId: createDeterministicKnowledgeSourceId(`official-doc:${fileName}`),
        title: fileName,
        content,
        metadata: {
          is_official: true,
          file_name: fileName,
          sync_origin: "api/admin/sync-knowledge",
        },
      });
    }

    return NextResponse.json({
      success: true,
      synced_files: files,
      count: files.length,
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
