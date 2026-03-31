import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type BridgeLogEntry,
  WebViewContainer,
  type WebViewContainerHandle,
  type WebViewControlState,
} from './WebViewContainer';

type WebScreenProps = {
  path: string;
  title: string;
};

const INITIAL_CONTROL_STATE: WebViewControlState = {
  canGoBack: false,
  currentUrl: '',
  hasError: false,
  isLoading: true,
};

export function WebScreen({ path, title }: WebScreenProps) {
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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.caption}>
              {controlState.hasError
                ? '연결 오류'
                : controlState.isLoading
                  ? '로딩 중'
                  : 'Web Harness'}
            </Text>
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
          </View>
        </View>
        {__DEV__ ? (
          <View style={styles.bridgePanel}>
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
      <WebViewContainer
        ref={webViewRef}
        onBridgeLog={handleBridgeLog}
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
  headerTextContainer: {
    flex: 1,
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
