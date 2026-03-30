import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/security/secrets";

export const SYSTEM_LLM_SECRET_NAME = "openrouter_api_key";

type ExtensionSecretRow = {
  encrypted_value: string;
  value_last4: string | null;
  updated_at: string | null;
};

export type ExtensionSecretSummary = {
  configured: boolean;
  maskedValue: string | null;
  source: "database" | "env" | null;
  updatedAt: string | null;
};

function isMissingSecretTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42P01" ||
    candidate.message?.includes("workspace_extension_secrets") === true
  );
}

async function getExtensionSecretRow(
  extName: string,
  secretName: string,
): Promise<ExtensionSecretRow | null> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("workspace_extension_secrets")
      .select("encrypted_value, value_last4, updated_at")
      .eq("ext_name", extName)
      .eq("secret_name", secretName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as ExtensionSecretRow | null) ?? null;
  } catch (error) {
    if (isMissingSecretTableError(error)) {
      console.warn("workspace_extension_secrets table not found; env fallback only.");
      return null;
    }

    throw error;
  }
}

export async function getDecryptedExtensionSecret(
  extName: string,
  secretName: string,
) {
  const row = await getExtensionSecretRow(extName, secretName);

  if (!row?.encrypted_value) {
    return null;
  }

  try {
    return decryptSecret(row.encrypted_value);
  } catch (error) {
    throw new Error(
      `${extName}/${secretName} 비밀값을 복호화할 수 없습니다. APP_SECRET_ENCRYPTION_KEY가 저장 시점과 동일한지 확인하거나, 설정 화면에서 API 키를 다시 저장해 주세요.`,
      { cause: error },
    );
  }
}

export async function getExtensionSecretSummary(input: {
  extName: string;
  secretName: string;
  fallbackValue?: string | null;
}) {
  const row = await getExtensionSecretRow(input.extName, input.secretName);

  if (row) {
    return {
      configured: true,
      maskedValue: row.value_last4 ? `••••••••${row.value_last4}` : "설정됨",
      source: "database",
      updatedAt: row.updated_at,
    } satisfies ExtensionSecretSummary;
  }

  const envMaskedValue = maskSecret(input.fallbackValue);

  return {
    configured: Boolean(envMaskedValue),
    maskedValue: envMaskedValue,
    source: envMaskedValue ? "env" : null,
    updatedAt: null,
  } satisfies ExtensionSecretSummary;
}

export async function upsertExtensionSecret(input: {
  extName: string;
  secretName: string;
  plainValue: string;
  updatedBy?: string | null;
}) {
  const value = input.plainValue.trim();

  if (!value) {
    throw new Error("저장할 비밀값이 비어 있습니다.");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("workspace_extension_secrets")
    .upsert(
      {
        ext_name: input.extName,
        secret_name: input.secretName,
        encrypted_value: encryptSecret(value),
        value_last4: value.slice(-4),
        updated_by: input.updatedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ext_name,secret_name" },
    );

  if (error) {
    throw new Error(error.message);
  }
}
