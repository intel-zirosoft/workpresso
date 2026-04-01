import { WebScreen } from '../../src/harness/webview/WebScreen';
import { MOBILE_APP_SECTIONS } from '../../src/shared/app-sections';

export default function ChatterTabScreen() {
  return (
    <WebScreen
      path={MOBILE_APP_SECTIONS.chatter.path}
      title={MOBILE_APP_SECTIONS.chatter.title}
    />
  );
}
