import { randomUUID } from "crypto";
import path from "path";
import dotenv from "dotenv";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const appUrl = process.env.PODD_TEST_BASE_URL ?? "http://localhost:3001";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Required env vars for Pod D STT integration test are missing.");
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function makeSilentWavBytes({
  sampleRate = 16_000,
  durationMs = 1_000,
  channels = 1,
  bitsPerSample = 16,
} = {}) {
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return Array.from(buffer);
}

test.describe("Pod D STT route", () => {
  test("authenticated user can transcribe audio through server route", async ({
    page,
  }) => {
    test.setTimeout(120000);

    const marker = randomUUID().slice(0, 8);
    const email = `podd-stt-${Date.now()}@example.com`;
    const password = "Workpresso123!";
    const name = `Pod D Test ${marker}`;
    let userId: string | undefined;

    try {
      const { data: createdUser, error: createUserError } =
        await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

      if (createUserError || !createdUser.user) {
        throw createUserError ?? new Error("Failed to create auth user.");
      }

      userId = createdUser.user.id;

      const { error: upsertUserError } = await adminSupabase.from("users").upsert({
        id: userId,
        name,
        status: "ACTIVE",
      });

      if (upsertUserError) {
        throw upsertUserError;
      }

      await page.goto(`${appUrl}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.locator('form button[type="submit"]').click();
      await page.waitForURL(/\/$/, { timeout: 20000 });

      const audioBytes = makeSilentWavBytes();

      const result = await page.evaluate(async (bytes) => {
        const file = new File([new Uint8Array(bytes)], "silence.wav", {
          type: "audio/wav",
        });
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/audio/transcribe", {
          method: "POST",
          body: formData,
        });

        return {
          status: response.status,
          body: await response.json().catch(async () => ({
            error: await response.text(),
          })),
        };
      }, audioBytes);

      expect(result.status).toBe(200);
      expect(String(result.body?.text ?? "").trim().length).toBeGreaterThan(0);
      expect(String(result.body?.model ?? "")).toContain("audio");
    } finally {
      if (userId) {
        await adminSupabase.from("users").delete().eq("id", userId);
        await adminSupabase.auth.admin.deleteUser(userId);
      }
    }
  });
});
