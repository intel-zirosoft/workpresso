import { randomUUID } from "crypto";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const appUrl = process.env.PODC_TEST_BASE_URL ?? "http://localhost:3001";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
  throw new Error("Required env vars for Pod C real integration test are missing.");
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const openai = new OpenAI({ apiKey: openAiKey });

test.describe("Pod C real integration", () => {
  test("chat streaming uses RAG and creates a schedule in Supabase", async ({ page }) => {
    test.setTimeout(120000);

    const marker = randomUUID().slice(0, 8);
    const email = `podc-chat-${Date.now()}@example.com`;
    const password = "Workpresso123!";
    const name = `Pod C Test ${marker}`;
    const department = "플랫폼실";
    const scheduleTitle = `Pod C CRUD 연동 점검 ${marker}`;
    const knowledgeId = randomUUID();
    let userId: string | undefined;

    try {
      const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, department },
      });

      if (createUserError || !createdUser.user) {
        throw createUserError ?? new Error("Failed to create auth user.");
      }

      userId = createdUser.user.id;

      const { error: upsertUserError } = await adminSupabase.from("users").upsert({
        id: userId,
        name,
        department,
        status: "ACTIVE",
      });

      if (upsertUserError) {
        throw upsertUserError;
      }

      const knowledgeContent =
        "워크프레소 내부 보안수칙 WP-SEC-77: 운영 DB 접속 비밀번호와 서비스 롤 키는 개인 메신저로 공유하면 안 되며, 반드시 Vault 승인 절차와 보안 채널을 사용해야 합니다.";

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: knowledgeContent,
      });

      const { error: knowledgeInsertError } = await adminSupabase.from("knowledge_vectors").insert({
        id: knowledgeId,
        source_type: "DOCUMENTS",
        source_id: userId,
        embedding: embeddingResponse.data[0].embedding,
        metadata: {
          title: `Pod C Integration ${marker}`,
          content: knowledgeContent,
          test_marker: marker,
        },
      });

      if (knowledgeInsertError) {
        throw knowledgeInsertError;
      }

      await page.goto(`${appUrl}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.locator('form button[type="submit"]').click();
      await page.waitForURL(/\/$/, { timeout: 20000 });

      await page.goto(`${appUrl}/chat`);

      const input = page.locator('input[placeholder*="질문"], input[placeholder*="명령어"]');
      const sendButton = page.locator('form button[type="submit"]');
      await expect(input).toBeVisible({ timeout: 10000 });

      const assistantMessages = page.locator(".prose-neutral");

      await input.fill("내부 보안수칙에 따르면 운영 DB 접속 정보를 공유할 때 따라야 하는 절차 번호를 알려줘.");
      await sendButton.click();

      await expect(assistantMessages).toHaveCount(1, { timeout: 30000 });
      await expect(assistantMessages.first()).toContainText("WP-SEC-77", { timeout: 30000 });

      await input.fill(
        `2026-03-28T15:00:00+09:00부터 2026-03-28T16:00:00+09:00까지 "${scheduleTitle}" 일정 등록해줘.`
      );
      await sendButton.click();

      await expect(assistantMessages).toHaveCount(2, { timeout: 30000 });

      await expect
        .poll(
          async () => {
            const { data, error } = await adminSupabase
              .from("schedules")
              .select("id")
              .eq("user_id", userId!)
              .eq("title", scheduleTitle)
              .is("deleted_at", null);

            if (error) throw error;
            return data.length;
          },
          { timeout: 30000 }
        )
        .toBe(1);

      const { data: insertedSchedule, error: scheduleFetchError } = await adminSupabase
        .from("schedules")
        .select("title, start_time, end_time, user_id")
        .eq("user_id", userId)
        .eq("title", scheduleTitle)
        .single();

      if (scheduleFetchError || !insertedSchedule) {
        throw scheduleFetchError ?? new Error("Inserted schedule not found.");
      }

      expect(insertedSchedule.title).toBe(scheduleTitle);
      expect(insertedSchedule.user_id).toBe(userId);
      expect(insertedSchedule.start_time).toContain("2026-03-28");
      expect(insertedSchedule.end_time).toContain("2026-03-28");
    } finally {
      if (userId) {
        await adminSupabase.from("schedules").delete().eq("user_id", userId).eq("title", scheduleTitle);
        await adminSupabase.from("knowledge_vectors").delete().eq("id", knowledgeId);
        await adminSupabase.from("users").delete().eq("id", userId);
        await adminSupabase.auth.admin.deleteUser(userId);
      }
    }
  });
});
