function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getAppBaseUrl(options?: {
  requestHeaders?: Headers;
  fallback?: string;
}) {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL);

  if (vercelEnv === "preview" && vercelUrl) {
    return vercelUrl;
  }

  const configuredUrl =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (vercelUrl) {
    return vercelUrl;
  }

  const requestHeaders = options?.requestHeaders;
  const forwardedProto = requestHeaders?.get("x-forwarded-proto") ?? "http";
  const forwardedHost =
    requestHeaders?.get("x-forwarded-host") ?? requestHeaders?.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  return normalizeBaseUrl(options?.fallback) ?? "http://localhost:3000";
}
