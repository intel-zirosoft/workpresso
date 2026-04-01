import { WebScreen } from '../../src/harness/webview/WebScreen';
import { MOBILE_APP_SECTIONS } from '../../src/shared/app-sections';

export default function ChatTabScreen() {
  return (
    <WebScreen
      path={MOBILE_APP_SECTIONS.chat.path}
      title={MOBILE_APP_SECTIONS.chat.title}
    />
  );
}
