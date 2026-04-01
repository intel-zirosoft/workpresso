import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type BridgeLogEntry,
  WebViewContainer,
  type WebViewContainerHandle,
  type WebViewControlState,
} from './WebViewContainer';
import {
  resolveTabHrefForPath,
  resolveTabHrefForUrl,
} from '../deeplink/deep-linking';

const INITIAL_CONTROL_STATE: WebViewControlState = {
  canGoBack: false,
  currentUrl: '',
  hasError: false,
  isLoading: true,
};

const APP_MENU_ITEMS = [
  {
    description: '오늘 업무 브리핑',
    href: '/(tabs)',
    kind: 'tab' as const,
    label: '홈',
  },
  {
    description: '읽지 않은 채널 확인',
    href: '/(tabs)/chatter',
    kind: 'tab' as const,
    label: '채터',
  },
  {
    description: '승인 대기 문서',
    href: '/(tabs)/documents',
    kind: 'tab' as const,
    label: '문서',
  },
  {
    description: '오늘과 이번 주 일정',
    href: '/(tabs)/schedules',
    kind: 'tab' as const,
    label: '일정',
  },
  {
    description: 'AI 업무 도우미',
    href: '/(tabs)/chat',
    kind: 'tab' as const,
    label: '도우미',
  },
  {
    description: '회의/음성 기록',
    href: '/(tabs)/voice',
    kind: 'tab' as const,
    label: '음성',
  },
  {
    description: '팀 현황 보기',
    kind: 'web' as const,
    label: '팀 상태',
    path: '/teammates?mobile=1',
    title: '팀 상태',
  },
  {
    description: '앱용 설정 보기',
    kind: 'web' as const,
    label: '설정',
    path: '/mobile-settings?mobile=1',
    title: '설정',
  },
] as const;

type WebScreenProps = {
  path: string;
  title: string;
};

export function WebScreen({ path, title }: WebScreenProps) {
  const router = useRouter();
  const currentTabHref = useMemo(() => resolveTabHrefForPath(path), [path]);
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [isBridgePanelOpen, setIsBridgePanelOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const webViewRef = useRef<WebViewContainerHandle>(null);
  const [bridgeLogs, setBridgeLogs] = useState<BridgeLogEntry[]>([]);
  const [controlState, setControlState] = useState<WebViewControlState>(
    INITIAL_CONTROL_STATE,
  );

  const handleStateChange = useCallback((nextState: WebViewControlState) => {
    setControlState(nextState);
  }, []);

  const handleBridgeLog = useCallback((entry: BridgeLogEntry) => {
    setBridgeLogs((current) => [entry, ...current].slice(0, 5));
  }, []);

  const runDeviceInfoCheck = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        if (window.WorkPressoMobile && typeof window.WorkPressoMobile.getDeviceInfo === 'function') {
          window.WorkPressoMobile.getDeviceInfo();
        }
      })();
      true;
    `);
  }, []);

  const runExternalUrlCheck = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        if (window.WorkPressoMobile && typeof window.WorkPressoMobile.openExternalUrl === 'function') {
          window.WorkPressoMobile.openExternalUrl('https://example.com');
        }
      })();
      true;
    `);
  }, []);

  const handleInternalRouteRequest = useCallback(
    (url: string) => {
      const tabHref = resolveTabHrefForUrl(url);

      if (
        !tabHref ||
        typeof tabHref !== 'string' ||
        !tabHref.startsWith('/(tabs)')
      ) {
        return false;
      }

      if (tabHref === currentTabHref) {
        return false;
      }

      router.navigate(tabHref);
      return true;
    },
    [currentTabHref, router],
  );

  const handleMenuNavigate = useCallback(
    (item: (typeof APP_MENU_ITEMS)[number]) => {
      setIsMenuOpen(false);

      if (item.kind === 'tab') {
        router.navigate(item.href);
        return;
      }

      router.push({
        pathname: '/web',
        params: {
          path: item.path,
          title: item.title,
        },
      });
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.leadingGroup}>
            <Pressable
              onPress={() => setIsMenuOpen(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuButtonText}>메뉴</Text>
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.caption}>
                {controlState.hasError
                  ? '연결 오류'
                  : controlState.isLoading
                    ? '로딩 중'
                    : '앱 화면'}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              disabled={!controlState.canGoBack}
              onPress={() => webViewRef.current?.goBack()}
              style={[
                styles.actionButton,
                !controlState.canGoBack && styles.actionButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  !controlState.canGoBack && styles.actionTextDisabled,
                ]}
              >
                뒤로
              </Text>
            </Pressable>
            <Pressable
              disabled={controlState.isLoading}
              onPress={() => webViewRef.current?.reload()}
              style={[
                styles.actionButton,
                controlState.isLoading && styles.actionButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  controlState.isLoading && styles.actionTextDisabled,
                ]}
              >
                새로고침
              </Text>
            </Pressable>
            {__DEV__ ? (
              <Pressable
                onPress={() => setIsBridgePanelOpen((current) => !current)}
                style={[
                  styles.actionButton,
                  styles.bridgeToggleButton,
                  isBridgePanelOpen && styles.bridgeToggleButtonActive,
                ]}
              >
                <Text style={styles.actionText}>
                  {isBridgePanelOpen ? '브리지 닫기' : '브리지'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {__DEV__ && isBridgePanelOpen ? (
          <View style={styles.bridgePanel}>
            {authWarning ? (
              <View style={styles.authWarningBox}>
                <Text style={styles.authWarningText}>{authWarning}</Text>
              </View>
            ) : null}
            <View style={styles.currentUrlBox}>
              <Text style={styles.currentUrlLabel}>현재 URL</Text>
              <Text style={styles.currentUrlText}>
                {controlState.currentUrl || path}
              </Text>
            </View>
            <View style={styles.bridgePanelHeader}>
              <Text style={styles.bridgePanelTitle}>브리지 확인</Text>
              <View style={styles.bridgeTestActions}>
                <Pressable
                  onPress={runDeviceInfoCheck}
                  style={styles.bridgeActionButton}
                >
                  <Text style={styles.bridgeActionText}>기기정보</Text>
                </Pressable>
                <Pressable
                  onPress={runExternalUrlCheck}
                  style={styles.bridgeActionButton}
                >
                  <Text style={styles.bridgeActionText}>외부링크</Text>
                </Pressable>
              </View>
            </View>
            {bridgeLogs.length > 0 ? (
              bridgeLogs.map((entry) => (
                <Text key={entry.id} style={styles.bridgeLogText}>
                  [{entry.direction}] {entry.type} {entry.payloadPreview}
                </Text>
              ))
            ) : (
              <Text style={styles.bridgeLogPlaceholder}>
                페이지 로드 후 브리지 주입 로그와 테스트 결과가 여기에 표시됩니다.
              </Text>
            )}
          </View>
        ) : null}
      </SafeAreaView>
      <Modal
        animationType='fade'
        onRequestClose={() => setIsMenuOpen(false)}
        transparent
        visible={isMenuOpen}
      >
        <Pressable
          onPress={() => setIsMenuOpen(false)}
          style={styles.menuBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.menuSheet}
          >
            <View style={styles.menuSheetHeader}>
              <Text style={styles.menuSheetEyebrow}>WorkPresso</Text>
              <Text style={styles.menuSheetTitle}>빠른 이동</Text>
              <Text style={styles.menuSheetDescription}>
                하단 탭과 함께 자주 쓰는 화면으로 이동하세요.
              </Text>
            </View>
            <View style={styles.menuItems}>
              {APP_MENU_ITEMS.map((item) => (
                <Pressable
                  key={`${item.kind}:${item.label}`}
                  onPress={() => handleMenuNavigate(item)}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemDescription}>
                    {item.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <WebViewContainer
        ref={webViewRef}
        onAuthWarningChange={setAuthWarning}
        onBridgeLog={handleBridgeLog}
        onInternalRouteRequest={handleInternalRouteRequest}
        path={path}
        onStateChange={handleStateChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerSafeArea: {
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  leadingGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  menuButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    paddingHorizontal: 16,
    paddingTop: 72,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },
  menuSheetHeader: {
    gap: 4,
    paddingBottom: 12,
  },
  menuSheetEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  menuSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSheetDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  bridgeToggleButton: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  bridgeToggleButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionTextDisabled: {
    color: '#94a3b8',
  },
  bridgePanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  authWarningBox: {
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  currentUrlBox: {
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  currentUrlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  currentUrlText: {
    fontSize: 11,
    color: '#0f172a',
  },
  bridgePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bridgePanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bridgeTestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bridgeActionButton: {
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bridgeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  bridgeLogText: {
    fontSize: 11,
    color: '#475569',
  },
  bridgeLogPlaceholder: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
