import { WebScreen } from '../../src/harness/webview/WebScreen';
import { MOBILE_APP_SECTIONS } from '../../src/shared/app-sections';

export default function VoiceTabScreen() {
  return (
    <WebScreen
      path={MOBILE_APP_SECTIONS.voice.path}
      title={MOBILE_APP_SECTIONS.voice.title}
    />
  );
}
