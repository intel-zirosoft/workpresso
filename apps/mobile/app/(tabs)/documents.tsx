import { WebScreen } from '../../src/harness/webview/WebScreen';
import { MOBILE_APP_SECTIONS } from '../../src/shared/app-sections';

export default function DocumentsTabScreen() {
  return (
    <WebScreen
      path={MOBILE_APP_SECTIONS.documents.path}
      title={MOBILE_APP_SECTIONS.documents.title}
    />
  );
}
