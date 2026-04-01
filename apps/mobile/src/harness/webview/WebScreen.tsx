import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WebViewContainer } from './WebViewContainer';
import {
  resolveTabHrefForPath,
  resolveTabHrefForUrl,
} from '../deeplink/deep-linking';

type WebScreenProps = {
  path: string;
  title: string;
};

export function WebScreen({ path }: WebScreenProps) {
  const router = useRouter();
  const currentTabHref = useMemo(() => resolveTabHrefForPath(path), [path]);

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

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <WebViewContainer
          onInternalRouteRequest={handleInternalRouteRequest}
          path={path}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
});
