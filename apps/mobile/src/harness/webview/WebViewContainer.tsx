import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigation,
  WebViewRenderProcessGoneEvent,
  WebViewTerminatedEvent,
} from 'react-native-webview/lib/WebViewTypes';

import { handleBridgeMessage } from '../bridge/bridge-handler';
import { buildInjectedBridgeScript } from '../bridge/injected-bridge';
import type {
  BridgeMessage,
  WebSessionStatusPayload,
} from '../bridge/bridge-types';
import { parseBridgeMessage } from '../bridge/bridge-handler';
import {
  getWebBaseOrigin,
  getWebBaseUrlHint,
  isInternalWebUrl,
  resolveWebUrl,
} from '../../shared/env/app-config';

export type WebViewControlState = {
  canGoBack: boolean;
  currentUrl: string;
  hasError: boolean;
  isLoading: boolean;
};

export type BridgeLogEntry = {
  direction: 'web->native' | 'native->web' | 'native';
  id: number;
  payloadPreview: string;
  type: string;
};

export type WebViewContainerHandle = {
  goBack: () => void;
  injectJavaScript: (script: string) => void;
  reload: () => void;
};

type WebViewContainerProps = {
  onAuthWarningChange?: (message: string | null) => void;
  onBridgeLog?: (entry: BridgeLogEntry) => void;
  path: string;
  onStateChange?: (state: WebViewControlState) => void;
};

const LOAD_TIMEOUT_MS = 15000;

export const WebViewContainer = forwardRef<
  WebViewContainerHandle,
  WebViewContainerProps
>(function WebViewContainer(
  { path, onAuthWarningChange, onBridgeLog, onStateChange },
  ref,
) {
  const webViewRef = useRef<WebView>(null);
  const bridgeLogIdRef = useRef(0);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [navigationState, setNavigationState] = useState({
    canGoBack: false,
    currentUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  const uri = useMemo(() => resolveWebUrl(path), [path]);
  const webBaseOrigin = useMemo(() => getWebBaseOrigin(), []);
  const webBaseUrlHint = useMemo(() => getWebBaseUrlHint(), []);
  const injectedBridgeScript = useMemo(
    () => buildInjectedBridgeScript(webBaseOrigin),
    [webBaseOrigin],
  );
  const hasError = Boolean(errorMessage);
  const currentUrl = navigationState.currentUrl || uri;

  const publishAuthWarning = useCallback(
    (message: string | null) => {
      onAuthWarningChange?.(message);
    },
    [onAuthWarningChange],
  );

  const buildAuthWarningMessage = useCallback(
    (payload?: WebSessionStatusPayload) => {
      if (!payload) {
        return null;
      }

      if (payload.kind === 'LOGIN_PAGE') {
        return '로그인 페이지로 이동했습니다. WebView 세션이 유지되지 않았을 수 있습니다.';
      }

      if (payload.kind === 'API_UNAUTHORIZED') {
        return `기능 요청이 인증 실패(${payload.status ?? 401})로 차단됐습니다. 다시 로그인해 주세요.`;
      }

      return null;
    },
    [],
  );

  const publishBridgeLog = useCallback(
    (
      direction: BridgeLogEntry['direction'],
      type: string,
      payload?: unknown,
    ) => {
      const rawPreview =
        typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});

      onBridgeLog?.({
        direction,
        id: ++bridgeLogIdRef.current,
        payloadPreview:
          rawPreview.length > 120 ? `${rawPreview.slice(0, 117)}...` : rawPreview,
        type,
      });
    },
    [onBridgeLog],
  );

  const publishState = useCallback(
    (next: Partial<WebViewControlState> = {}) => {
      onStateChange?.({
        canGoBack: next.canGoBack ?? navigationState.canGoBack,
        currentUrl: next.currentUrl ?? currentUrl,
        hasError: next.hasError ?? hasError,
        isLoading: next.isLoading ?? isLoading,
      });
    },
    [currentUrl, hasError, isLoading, navigationState.canGoBack, onStateChange],
  );

  const setLoadFailure = useCallback(
    (message: string) => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      setErrorMessage(message);
      setIsLoading(false);
      publishState({ hasError: true, isLoading: false });
    },
    [publishState],
  );

  const scheduleLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      setLoadFailure(
        '응답이 지연되고 있습니다. 같은 네트워크 연결과 Web URL 설정을 확인한 뒤 다시 시도해주세요.',
      );
    }, LOAD_TIMEOUT_MS);
  }, [setLoadFailure]);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearLoadTimeout, [clearLoadTimeout]);

  const goBack = useCallback(() => {
    if (!navigationState.canGoBack) {
      return;
    }

    webViewRef.current?.goBack();
  }, [navigationState.canGoBack]);

  const reload = useCallback(() => {
    setErrorMessage(null);
    setIsLoading(true);

    if (hasError) {
      setReloadKey((current) => current + 1);
      publishState({ hasError: false, isLoading: true });
      return;
    }

    webViewRef.current?.reload();
    publishState({ hasError: false, isLoading: true });
  }, [hasError, publishState]);

  useImperativeHandle(
    ref,
    () => ({
      goBack,
      injectJavaScript: (script: string) => {
        webViewRef.current?.injectJavaScript(script);
      },
      reload,
    }),
    [goBack, reload],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (!navigationState.canGoBack) {
            return false;
          }

          webViewRef.current?.goBack();
          return true;
        },
      );

      return () => subscription.remove();
    }, [navigationState.canGoBack]),
  );

  const sendToWeb = useCallback((message: BridgeMessage) => {
    publishBridgeLog('native->web', message.type, message.payload);

    const serialized = JSON.stringify(message)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");

    webViewRef.current?.injectJavaScript(`
      (function() {
        var message = JSON.parse('${serialized}');
        if (window.WorkPressoMobile && typeof window.WorkPressoMobile.onNativeMessage === 'function') {
          window.WorkPressoMobile.onNativeMessage(message);
        }
        window.dispatchEvent(new CustomEvent('workpresso:native-message', { detail: message }));
      })();
      true;
    `);
  }, []);

  const openExternalUrl = useCallback(async (url: string) => {
    if (!url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        throw new Error('지원되지 않는 링크 형식입니다.');
      }

      publishBridgeLog('native', 'OPEN_EXTERNAL_URL', { url });
      await Linking.openURL(url);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '잠시 후 다시 시도해주세요.';

      Alert.alert('링크를 열 수 없습니다.', message);
      throw error;
    }
  }, [publishBridgeLog]);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      if (!request.isTopFrame) {
        return true;
      }

      if (isInternalWebUrl(request.url)) {
        return true;
      }

      void openExternalUrl(request.url).catch(() => undefined);
      return false;
    },
    [openExternalUrl],
  );

  const handleNavigationStateChange = useCallback(
    (nextState: WebViewNavigation) => {
      const next = {
        canGoBack: nextState.canGoBack,
        currentUrl: nextState.url,
      };

      setNavigationState(next);
      publishState(next);
    },
    [publishState],
  );

  const handleLoadStart = useCallback(() => {
    scheduleLoadTimeout();
    publishAuthWarning(null);
    setIsLoading(true);
    setErrorMessage(null);
    publishState({ hasError: false, isLoading: true });
  }, [publishAuthWarning, publishState, scheduleLoadTimeout]);

  const handleLoadEnd = useCallback(() => {
    clearLoadTimeout();
    setIsLoading(false);
    publishState({ isLoading: false });
  }, [clearLoadTimeout, publishState]);

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      const description = event.nativeEvent.description || '네트워크 또는 서버 상태를 확인해주세요.';

      setLoadFailure(description);
    },
    [setLoadFailure],
  );

  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      const failedUrl = event.nativeEvent.url;

      if (failedUrl && failedUrl !== currentUrl && failedUrl !== uri) {
        return;
      }

      const description =
        event.nativeEvent.description ||
        `HTTP ${event.nativeEvent.statusCode} 응답을 받았습니다.`;

      setLoadFailure(`${description} (HTTP ${event.nativeEvent.statusCode})`);
    },
    [currentUrl, setLoadFailure, uri],
  );

  const handleRenderProcessGone = useCallback(
    (event: WebViewRenderProcessGoneEvent) => {
      setLoadFailure(
        event.nativeEvent.didCrash
          ? '웹 화면이 비정상 종료되었습니다. 다시 시도해주세요.'
          : '웹 화면이 다시 시작되어야 합니다. 다시 시도해주세요.',
      );
    },
    [setLoadFailure],
  );

  const handleContentProcessDidTerminate = useCallback(
    (_event: WebViewTerminatedEvent) => {
      setLoadFailure('웹 화면이 종료되었습니다. 다시 시도해주세요.');
    },
    [setLoadFailure],
  );

  if (hasError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>웹 화면을 불러오지 못했습니다.</Text>
        <Text style={styles.errorDescription}>{currentUrl}</Text>
        <Text style={styles.errorHelper}>{errorMessage}</Text>
        {webBaseUrlHint ? (
          <Text style={styles.errorHint}>{webBaseUrlHint}</Text>
        ) : null}
        <Pressable onPress={reload} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={`${uri}:${reloadKey}`}
        source={{ uri }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={(event) => {
          const parsedMessage = parseBridgeMessage(event.nativeEvent.data);

          publishBridgeLog(
            'web->native',
            parsedMessage?.type ?? 'INVALID_MESSAGE',
            parsedMessage?.payload ?? event.nativeEvent.data,
          );

          if (parsedMessage?.type === 'WEB_ROUTE_CHANGED') {
            const payload =
              parsedMessage.payload && typeof parsedMessage.payload === 'object'
                ? (parsedMessage.payload as { url?: string })
                : undefined;
            const nextUrl =
              payload?.url && typeof payload.url === 'string'
                ? payload.url
                : currentUrl;

            clearLoadTimeout();
            setErrorMessage(null);
            setIsLoading(false);
            setNavigationState((previous) => ({
              ...previous,
              currentUrl: nextUrl,
            }));
            publishState({
              currentUrl: nextUrl,
              hasError: false,
              isLoading: false,
            });
          }

          if (parsedMessage?.type === 'WEB_SESSION_STATUS') {
            publishAuthWarning(
              buildAuthWarningMessage(
                parsedMessage.payload as WebSessionStatusPayload | undefined,
              ),
            );
          }

          void handleBridgeMessage(event.nativeEvent.data, {
            openExternalUrl,
            sendToWeb,
          });
        }}
        onRenderProcessGone={handleRenderProcessGone}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
        injectedJavaScriptBeforeContentLoaded={injectedBridgeScript}
        allowsBackForwardNavigationGestures
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
      />
      {isLoading ? (
        <View pointerEvents='none' style={styles.loadingOverlay}>
          <ActivityIndicator size='small' color='#2563eb' />
          <Text style={styles.loadingText}>불러오는 중...</Text>
          <Text style={styles.loadingSubtext}>네트워크 환경에 따라 조금 더 걸릴 수 있습니다.</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  errorDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  errorHelper: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  loadingText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
});
