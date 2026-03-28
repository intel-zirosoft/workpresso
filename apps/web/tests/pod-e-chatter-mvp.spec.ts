import { randomUUID } from "crypto";
import path from "path";
import dotenv from "dotenv";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const appUrl = process.env.PODE_TEST_BASE_URL ?? "http://localhost:3001";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Required env vars for Pod E real integration test are missing.");
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

test.describe("Pod E chatter MVP", () => {
  test("channel list, linked message render, and message creation work with live Supabase data", async ({
    page,
  }) => {
    test.setTimeout(120000);

    const marker = randomUUID().slice(0, 8);
    const email = `pode-chat-${Date.now()}@example.com`;
    const password = "Workpresso123!";
    const name = `Pod E Test ${marker}`;
    const department = "플랫폼실";
    const channelId = randomUUID();
    const documentId = randomUUID();
    const seededMessageId = randomUUID();
    const scheduleId = randomUUID();
    const newMessageBody = `Pod E 실메시지 검증 ${marker}`;
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

      const { error: scheduleError } = await adminSupabase.from("schedules").insert({
        id: scheduleId,
        user_id: userId,
        title: `Pod E 일정 ${marker}`,
        start_time: "2026-03-28T10:00:00+09:00",
        end_time: "2026-03-28T11:00:00+09:00",
      });

      if (scheduleError) {
        throw scheduleError;
      }

      const { error: documentError } = await adminSupabase.from("documents").insert({
        id: documentId,
        author_id: userId,
        title: `Pod E 문서 ${marker}`,
        content: "Pod E linked document seed",
        status: "DRAFT",
      });

      if (documentError) {
        throw documentError;
      }

      const { error: channelError } = await adminSupabase.from("chat_channels").insert({
        id: channelId,
        name: `MVP 채널 ${marker}`,
        description: "Pod E MVP 채널 실통합 검증",
        type: "DEPARTMENT",
        visibility: "PRIVATE",
        owner_id: userId,
        department,
        last_message_at: new Date().toISOString(),
      });

      if (channelError) {
        throw channelError;
      }

      const { error: memberError } = await adminSupabase.from("chat_channel_members").insert({
        channel_id: channelId,
        user_id: userId,
        role: "OWNER",
      });

      if (memberError) {
        throw memberError;
      }

      const { error: seededMessageError } = await adminSupabase.from("chat_messages").insert({
        id: seededMessageId,
        channel_id: channelId,
        author_id: userId,
        message_type: "LINKED_OBJECT",
        content: "초기 링크 메시지입니다.",
        metadata: {
          linkedObject: {
            type: "DOCUMENT",
            id: documentId,
            label: `Pod E 문서 ${marker}`,
            kind: "문서",
            meta: "임시 저장 · 초기 시드",
          },
        },
      });

      if (seededMessageError) {
        throw seededMessageError;
      }

      await page.goto(`${appUrl}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.locator('form button[type="submit"]').click();
      await page.waitForURL(/\/$/, { timeout: 20000 });

      await page.goto(`${appUrl}/chatter`);

      await expect(page.getByText(`MVP 채널 ${marker}`)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(`Pod E 문서 ${marker}`)).toBeVisible({ timeout: 15000 });

      const messageBox = page.locator("textarea");
      await messageBox.fill(newMessageBody);
      await page.locator("textarea + button").click();

      await expect(page.getByText(newMessageBody)).toBeVisible({ timeout: 15000 });

      await expect
        .poll(
          async () => {
            const { data, error } = await adminSupabase
              .from("chat_messages")
              .select("id")
              .eq("channel_id", channelId)
              .eq("author_id", userId!)
              .eq("content", newMessageBody)
              .is("deleted_at", null);

            if (error) throw error;
            return data.length;
          },
          { timeout: 20000 }
        )
        .toBe(1);
    } finally {
      if (userId) {
        await adminSupabase.from("chat_messages").delete().eq("channel_id", channelId);
        await adminSupabase.from("chat_channel_members").delete().eq("channel_id", channelId);
        await adminSupabase.from("chat_channels").delete().eq("id", channelId);
        await adminSupabase.from("documents").delete().eq("id", documentId);
        await adminSupabase.from("schedules").delete().eq("id", scheduleId);
        await adminSupabase.from("users").delete().eq("id", userId);
        await adminSupabase.auth.admin.deleteUser(userId);
      }
    }
  });
});
