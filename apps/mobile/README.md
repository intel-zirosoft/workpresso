# WorkPresso Mobile

안드로이드 Expo Go 기준의 WorkPresso 모바일 MVP 실행 메모입니다.

## 실행

### 1. 웹 서버
```bash
cd apps/web
npm run dev -- --hostname 0.0.0.0 --port 3000
```

### 2. 모바일 환경 변수
`apps/mobile/.env.local`

```env
EXPO_PUBLIC_WEB_BASE_URL=http://<PC_LAN_IP>:3000
EXPO_PUBLIC_DEEP_LINK_SCHEME=workpresso
```

### 3. Expo
```bash
cd apps/mobile
npx expo start --host lan
```

## 시연 전 확인

- 홈 / 채터 / 일정 / 문서 / 도우미 / 음성 탭 진입
- WebView 로딩 / 에러 / 재시도
- 외부 링크 처리
- Android 뒤로가기 / 새로고침
- 브리지 확인 패널
  - 기기정보
  - 외부링크

## 상세 체크리스트

자세한 시연 순서와 점검 항목은 아래 문서를 사용합니다.

- `docs/specs/Mobile_App_MVP_Demo_Checklist.md`
