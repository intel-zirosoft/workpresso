import { useCallback, useEffect, useRef } from 'react';
import * as ExpoLinking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resolveAppDeepLink } from '../src/harness/deeplink/deep-linking';

function DeepLinkHandler() {
  const router = useRouter();
  const lastHandledUrlRef = useRef<string | null>(null);

  const handleIncomingUrl = useCallback(
    (url: string | null) => {
      if (!url || lastHandledUrlRef.current === url) {
        return;
      }

      const href = resolveAppDeepLink(url);

      if (!href) {
        return;
      }

      lastHandledUrlRef.current = url;
      router.replace(href);
    },
    [router],
  );

  useEffect(() => {
    let isMounted = true;

    void ExpoLinking.getInitialURL().then((url) => {
      if (!isMounted) {
        return;
      }

      handleIncomingUrl(url);
    });

    const subscription = ExpoLinking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [handleIncomingUrl]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <DeepLinkHandler />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="web" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
