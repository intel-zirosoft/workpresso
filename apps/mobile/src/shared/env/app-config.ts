import Constants from 'expo-constants';

const FALLBACK_WEB_BASE_URL = 'http://localhost:3000';
const FALLBACK_DEEP_LINK_SCHEME = 'workpresso';

function normalizeBaseUrl(url?: string) {
  if (!url) {
    return FALLBACK_WEB_BASE_URL;
  }

  return url.replace(/\/+$/, '');
}

function isLoopbackHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  );
}

function extractHostname(hostUri: string) {
  try {
    const normalizedHostUri = hostUri.includes('://') ? hostUri : `http://${hostUri}`;
    return new URL(normalizedHostUri).hostname;
  } catch {
    return hostUri.replace(/:\d+$/, '');
  }
}

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (typeof Constants.expoGoConfig?.debuggerHost === 'string'
      ? Constants.expoGoConfig.debuggerHost
      : null);

  if (!hostUri) {
    return null;
  }

  return extractHostname(hostUri) || null;
}

function resolveWebBaseUrl(url?: string) {
  const normalizedUrl = normalizeBaseUrl(url);

  try {
    const parsedUrl = new URL(normalizedUrl);

    if (!isLoopbackHost(parsedUrl.hostname)) {
      return normalizedUrl;
    }

    const expoHost = getExpoHost();

    if (!expoHost) {
      return normalizedUrl;
    }

    parsedUrl.hostname = expoHost;
    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return normalizedUrl;
  }
}

export const appConfig = {
  deepLinkScheme:
    process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME ?? FALLBACK_DEEP_LINK_SCHEME,
  webBaseUrl: resolveWebBaseUrl(process.env.EXPO_PUBLIC_WEB_BASE_URL),
};

export function resolveWebUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appConfig.webBaseUrl}${normalizedPath}`;
}

export function getWebBaseOrigin() {
  return new URL(appConfig.webBaseUrl).origin;
}

export function getWebBaseUrlHint() {
  try {
    const { hostname } = new URL(appConfig.webBaseUrl);

    if (isLoopbackHost(hostname)) {
      return 'Expo Go 실기기에서는 localhost 대신 PC의 LAN IP를 사용하세요.';
    }
  } catch {
    return null;
  }

  return null;
}

export function isInternalWebUrl(url: string) {
  if (!url) {
    return false;
  }

  if (url.startsWith('about:blank')) {
    return true;
  }

  try {
    return new URL(url).origin === getWebBaseOrigin();
  } catch {
    return false;
  }
}
