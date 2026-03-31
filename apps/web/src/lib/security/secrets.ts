import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const SECRET_ENCRYPTION_ENV_NAME = "APP_SECRET_ENCRYPTION_KEY";
const SECRET_VERSION = "v1";

function getSecretEncryptionKey() {
  const rawKey = process.env[SECRET_ENCRYPTION_ENV_NAME]?.trim();

  if (!rawKey) {
    throw new Error(
      `${SECRET_ENCRYPTION_ENV_NAME} 환경변수가 필요합니다. OpenRouter API 키를 DB에 저장하려면 서버 암호화 키를 먼저 설정하세요.`,
    );
  }

  return createHash("sha256").update(rawKey).digest();
}

export function encryptSecret(value: string) {
  const plainText = value.trim();

  if (!plainText) {
    throw new Error("암호화할 비밀값이 비어 있습니다.");
  }

  const key = getSecretEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    SECRET_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string) {
  const [version, ivBase64, authTagBase64, encryptedBase64] = payload.split(":");

  if (
    version !== SECRET_VERSION ||
    !ivBase64 ||
    !authTagBase64 ||
    !encryptedBase64
  ) {
    throw new Error("저장된 비밀값 형식이 올바르지 않습니다.");
  }

  const key = getSecretEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function maskSecret(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const last4 = normalized.slice(-4);
  return `••••••••${last4}`;
}

