import { WebScreen } from '../../src/harness/webview/WebScreen';
import { MOBILE_APP_SECTIONS } from '../../src/shared/app-sections';

export default function SchedulesTabScreen() {
  return (
    <WebScreen
      path={MOBILE_APP_SECTIONS.schedules.path}
      title={MOBILE_APP_SECTIONS.schedules.title}
    />
  );
}
