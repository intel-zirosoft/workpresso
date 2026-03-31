import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
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
  const [controlState, setControlState] = useState<WebViewControlState>(
    INITIAL_CONTROL_STATE,
  );

  const handleStateChange = useCallback((nextState: WebViewControlState) => {
    setControlState(nextState);
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
      </SafeAreaView>
      <WebViewContainer
        ref={webViewRef}
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
});
