import type { Href } from 'expo-router';

import { appConfig, getWebBaseOrigin } from '../../shared/env/app-config';

const TAB_ROUTE_BY_WEB_PATH = {
  '/': '/(tabs)',
  '/chat': '/(tabs)/chat',
  '/chatter': '/(tabs)/chatter',
  '/documents': '/(tabs)/documents',
  '/home': '/(tabs)',
  '/index': '/(tabs)',
  '/schedules': '/(tabs)/schedules',
  '/voice': '/(tabs)/voice',
} as const satisfies Record<string, Href>;

const TITLE_BY_PREFIX: Array<[prefix: string, title: string]> = [
  ['/chatter', '채터'],
  ['/schedules', '일정'],
  ['/documents', '문서'],
  ['/chat', '업무 도우미'],
  ['/voice', '음성'],
];

function getTabRoute(path: string) {
  return (TAB_ROUTE_BY_WEB_PATH as Record<string, Href | undefined>)[path] ?? null;
}

function normalizePath(path: string) {
  if (!path) {
    return '/';
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.replace(/\/+$/, '') || '/';
}

function buildWebPath(pathname: string, search = '', hash = '') {
  return `${normalizePath(pathname)}${search}${hash}`;
}

function getDeepLinkPath(url: URL) {
  const hostPath = url.hostname ? `/${url.hostname}` : '';
  const pathname = url.pathname === '/' ? '' : url.pathname;
  return normalizePath(`${hostPath}${pathname}`);
}

function getTabRouteFromWebPath(path: string) {
  try {
    const url = new URL(path, getWebBaseOrigin());
    return getTabRoute(normalizePath(url.pathname));
  } catch {
    return getTabRoute(normalizePath(path.split(/[?#]/, 1)[0] ?? path));
  }
}

export function inferDeepLinkTitle(path: string) {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === '/') {
    return '홈';
  }

  const matchedTitle = TITLE_BY_PREFIX.find(([prefix]) =>
    normalizedPath.startsWith(prefix),
  );

  return matchedTitle?.[1] ?? '바로가기';
}

export function resolveTabHrefForPath(path: string) {
  return getTabRouteFromWebPath(path);
}

export function resolveTabHrefForUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const scheme = url.protocol.replace(':', '');

    if (scheme === appConfig.deepLinkScheme) {
      return getTabRoute(getDeepLinkPath(url));
    }

    if (url.origin !== getWebBaseOrigin()) {
      return null;
    }

    return getTabRoute(normalizePath(url.pathname));
  } catch {
    return null;
  }
}

export function resolveAppDeepLink(rawUrl: string): Href | null {
  try {
    const url = new URL(rawUrl);
    const scheme = url.protocol.replace(':', '');

    if (scheme === appConfig.deepLinkScheme) {
      const deepLinkPath = getDeepLinkPath(url);
      const tabRoute = getTabRoute(deepLinkPath);

      if (tabRoute && !url.search && !url.hash) {
        return tabRoute;
      }

      const webPath = buildWebPath(deepLinkPath, url.search, url.hash);
      return {
        pathname: '/web',
        params: {
          path: webPath,
          title: inferDeepLinkTitle(deepLinkPath),
        },
      };
    }

    if (url.origin !== getWebBaseOrigin()) {
      return null;
    }

    const normalizedPath = normalizePath(url.pathname);
    const tabRoute = getTabRoute(normalizedPath);

    if (tabRoute && !url.search && !url.hash) {
      return tabRoute;
    }

    return {
      pathname: '/web',
      params: {
        path: buildWebPath(normalizedPath, url.search, url.hash),
        title: inferDeepLinkTitle(normalizedPath),
      },
    };
  } catch {
    return null;
  }
}
