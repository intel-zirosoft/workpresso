import { useLocalSearchParams } from 'expo-router';

import { inferDeepLinkTitle } from '../src/harness/deeplink/deep-linking';
import { WebScreen } from '../src/harness/webview/WebScreen';

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function DeepLinkedWebScreen() {
  const params = useLocalSearchParams<{
    path?: string | string[];
    title?: string | string[];
  }>();

  const path = getSingleParam(params.path) ?? '/';
  const title = getSingleParam(params.title) ?? inferDeepLinkTitle(path);

  return <WebScreen path={path} title={title} />;
}
