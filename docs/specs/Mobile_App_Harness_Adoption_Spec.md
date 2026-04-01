# WorkPresso 모바일 앱 하네스 도입 설계서

본 문서는 현재 `apps/web`를 기반으로 WorkPresso를 모바일 앱으로 전환할 때 적용할 **Harness(하네스) 방식**의 목표 구조, 단계별 도입 방식, 권장 기술 선택, 위험 요소, 구현 순서를 정리한 설계 문서입니다.

---

## 1. 문서 목적

현재 WorkPresso는 `apps/web` 중심의 Next.js App Router 구조로 구현되어 있습니다.
모바일 앱 전환 시 전체 기능을 처음부터 네이티브로 재작성하면 비용과 리스크가 크므로, 본 문서는 다음 전략을 목표로 합니다.

1. 기존 `apps/web` 자산을 최대한 재사용한다.
2. 앱은 우선 **Shell + Web Harness** 구조로 빠르게 출시한다.
3. 모바일 효용이 큰 기능만 순차적으로 네이티브화한다.
4. 웹과 앱의 기능 소스 오브 트루스를 불필요하게 이원화하지 않는다.

---

## 2. 현재 프로젝트 기준 판단

### 2.1. 현재 구조 요약
- 웹 앱: `apps/web`
- 모바일 앱 디렉터리: `apps/mobile` (현재 비어 있음)
- 주요 웹 도메인:
  - Pod A: Documents
  - Pod B: Schedules
  - Pod C: Chat / Knowledge
  - Pod D: Voice / Meeting Logs
  - Pod E: Chatter
- 인증: Supabase SSR + cookie 기반 세션
- 배포: Vercel + Next.js standalone output

### 2.2. 현재 구조의 특징
- 기능이 `apps/web/src/features/*` 기준으로 잘 나뉘어 있음
- API가 `apps/web/src/app/api/*`에 이미 풍부하게 구현되어 있음
- 앱 전환 시 재사용 가능한 비즈니스 로직과 API가 많음
- 반면 UI는 Web 전용 의존성(Radix, FullCalendar, Web recorder 등)이 포함되어 있음

### 2.3. 결론
현재 상태에서는 **Full Native 재작성보다 Harness 방식이 훨씬 적합**합니다.

---

## 3. 권장 전략: Hybrid Mobile Harness

### 3.1. 정의
모바일 앱은 다음 두 층으로 구성합니다.

1. **App Shell (Native Layer)**
   - Expo/React Native 앱
   - 탭, 딥링크, 푸시, 권한, WebView, 브리지 담당

2. **Web Harness (Embedded Web Layer)**
   - `apps/web`의 페이지를 WebView로 렌더링
   - 기존 Next.js 화면과 API를 그대로 활용

### 3.2. 권장 이유
- 출시 속도가 빠름
- 기존 웹 기능을 즉시 활용 가능
- 앱 전환 중 기능 누락 위험 감소
- Pod 단위로 선택적 네이티브 전환 가능

---

## 4. 기술 선택 권장안

### 4.1. 모바일 프레임워크
**권장: Expo + React Native**

이유:
- 앱 셸 개발 속도 우수
- WebView, 딥링크, 푸시, 파일, 카메라/마이크 연동이 빠름
- 나중에 Pod-D, Pod-E를 네이티브로 추출하기 쉬움

### 4.2. Web Harness 구성 방식
**권장: 탭/화면별 URL 매핑형 WebView Harness**

예:
- 홈: `/`
- 문서: `/documents`
- 업무 도우미: `/chat`
- 일정: `/schedules`
- 채터: `/chatter`
- 음성: `/voice`

이 방식은 앱의 탭 UX와 웹 라우팅을 함께 유지하기 좋습니다.

---

## 5. 권장 폴더 구조

```text
apps/
  mobile/
    app/
      (tabs)/
        index.tsx
        documents.tsx
        chat.tsx
        schedules.tsx
        chatter.tsx
        voice.tsx
    src/
      harness/
        webview/
          WebScreen.tsx
          WebViewContainer.tsx
        bridge/
          bridge-types.ts
          bridge-client.ts
          bridge-handler.ts
        auth/
        deeplink/
        notifications/
      features/
        voice-native/
        chatter-native/
        schedules-native/
      shared/
        env/
        utils/
```

---

## 6. 하네스 아키텍처

### 6.1. 1단계 기본 흐름

```text
Native Tab Screen
  -> WebView
    -> apps/web URL 로드
      -> 기존 Next.js UI + 기존 API 사용
```

### 6.2. 2단계 확장 흐름

```text
Web 화면
  -> bridge event 전송
    -> Native Layer 처리
      -> 결과를 WebView로 callback
```

예:
- 웹에서 “음성 녹음 시작” 버튼 클릭
- Native recorder 실행
- 녹음 완료 후 파일 경로/Blob/업로드 결과를 웹 쪽으로 전달

---

## 7. 브리지(Bridge) 설계

### 7.1. 브리지의 역할
웹에서 앱 전용 기능을 직접 쓸 수 없으므로, 아래 기능을 Native Layer가 대신 처리해야 합니다.

- 마이크 권한 요청
- 파일 선택
- 공유 시트 호출
- 푸시 토큰 등록
- 딥링크 열기
- 외부 브라우저/인앱 브라우저 열기
- 햅틱 피드백

### 7.2. 권장 브리지 이벤트 목록

#### Web -> Native
- `OPEN_NATIVE_RECORDER`
- `PICK_FILE`
- `OPEN_SHARE_SHEET`
- `OPEN_EXTERNAL_URL`
- `REQUEST_PUSH_PERMISSION`
- `GET_DEVICE_INFO`
- `HAPTIC_FEEDBACK`

#### Native -> Web
- `RECORDER_RESULT`
- `FILE_PICK_RESULT`
- `SHARE_COMPLETED`
- `PUSH_TOKEN_READY`
- `DEVICE_INFO_RESULT`
- `ERROR`

### 7.3. 메시지 포맷 예시
```json
{
  "type": "OPEN_NATIVE_RECORDER",
  "payload": {
    "accept": "audio/*",
    "maxDurationSec": 1800
  }
}
```

---

## 8. 인증 전략

### 8.1. 초기 권장안: Web-owned Auth
초기 단계에서는 로그인도 WebView 안에서 처리하고, 세션도 웹 기준으로 유지합니다.

#### 장점
- 현재 `apps/web`의 Supabase SSR/cookie 구조와 가장 잘 맞음
- 세션 브리지 구현 비용이 낮음
- 기능 전환 속도가 빠름

#### 단점
- 완전 네이티브 로그인 경험은 아님
- 앱 고유 인증 UX 개선은 후순위가 됨

### 8.2. 후속 확장안: Native Auth + Session Bridge
네이티브 화면이 늘어나면 이후 아래 구조로 확장합니다.

- Native Layer가 Supabase 세션 보유
- WebView에는 세션 브리지를 통해 전달
- 서버는 기존 웹 흐름과 호환되도록 유지

**권장 시점:** Pod-D/Pod-E 일부가 네이티브로 치환된 이후

---

## 9. Pod별 전환 우선순위

### 9.1. 1순위: Pod-D Voice
이유:
- 오디오 녹음은 모바일 네이티브 이점이 큼
- 마이크 권한, 백그라운드, 파일 처리에서 WebView 한계가 큼

권장 전략:
- 1단계: `/voice` WebView
- 2단계: 녹음/업로드만 Native
- 3단계: 회의록 상세도 일부 Native 전환

### 9.2. 2순위: Pod-E Chatter
이유:
- 푸시 알림과 채널 이동이 모바일 핵심 경험
- 메시징 UX는 앱에서 개선 가치가 큼

권장 전략:
- 1단계: `/chatter` WebView
- 2단계: 채널 목록 + 메시지 화면 Native
- 3단계: 브리핑/공유/알림 연동 강화

### 9.3. 3순위: Pod-B Schedules
이유:
- 캘린더는 모바일 최적화 이점이 큼
- 현재 FullCalendar 기반 UI는 모바일 앱에서 그대로 유지하기 비효율적일 수 있음

권장 전략:
- 1단계: `/schedules` WebView
- 2단계: 오늘 일정, 생성/수정만 Native
- 3단계: 전체 월간/주간 뷰 Native 재설계

### 9.4. 4순위: Pod-C Chat
권장 전략:
- 초기에는 웹 유지
- 이후 입력창, 스트리밍 메시지 UI, 추천 액션만 Native화 검토

### 9.5. 5순위: Pod-A Documents
권장 전략:
- 초기에는 웹 유지 권장
- 문서 상세/결재 액션은 가능하지만 Markdown 편집기의 완전 네이티브 전환은 후순위

---

## 10. URL 및 환경 전략

현재 웹은 `getAppBaseUrl()` 기반으로 로컬/Preview/Production URL을 해석하도록 정리되어 있습니다.

### 10.1. 권장 환경 설정

#### Local
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Vercel Production
```env
NEXT_PUBLIC_APP_URL=https://workpresso.vercel.app
```

#### Vercel Preview
- `VERCEL_URL` 자동 사용
- 별도 고정 Preview URL 하드코딩 비권장

### 10.2. 모바일 앱의 URL 전략
앱 셸은 최소한 아래 2개를 구분해야 합니다.

1. **Web Harness Base URL**
   - 로컬 개발 시 로컬 웹 서버 주소
   - 운영 시 Vercel production URL

2. **Deep Link Base**
   - 예: `workpresso://`

---

## 11. 1단계 출시 범위(MVP)

### 포함
- 앱 셸
- 탭 구조
- 공통 WebView Harness
- 로그인/홈/문서/채팅/일정/채터/음성 WebView 진입
- 딥링크 기본 처리
- 외부 링크 처리

### 제외
- 전체 네이티브 재작성
- 복잡한 session bridge
- 오프라인 동기화
- 모바일 전용 대규모 상태 저장 구조

---

## 12. 단계별 구현 계획

### Phase 1. 앱 셸 구성
- `apps/mobile`에 Expo 앱 초기화
- 탭 구조 생성
- 환경 분기(local/staging/prod) 정의
- 공통 WebView 화면 추가

### Phase 2. Web Harness 연결
- 탭별 URL 매핑
- 로딩/에러/재시도 UI
- 외부 링크 처리
- 기본 딥링크 이동 처리

### Phase 3. 브리지 1차 도입
- 공유 시트
- 외부 URL 열기
- 푸시 권한 요청
- 디바이스 정보 전달

### Phase 4. Pod-D 네이티브 추출
- 녹음 권한
- 네이티브 오디오 녹음
- 업로드 연동
- 웹 화면과 결과 연계

### Phase 5. Pod-E 네이티브 추출
- 푸시 클릭 시 채널 이동
- 채널 목록/메시지 UI 분리
- 시스템 브리핑 UX 강화

### Phase 6. Pod-B 일부 네이티브 추출
- 오늘 일정
- 일정 생성/수정
- 기본 알림 연동

### Phase 7. 인증 고도화
- 필요 시 Native Auth + Session Bridge 검토

---

## 13. 예외 상황 및 위험 요소

### 13.1. 인증 불일치
위험:
- WebView 세션과 Native 세션이 분리될 수 있음

대응:
- 초기에는 Web-owned Auth 유지
- 네이티브 인증은 후속 단계로 분리

### 13.2. 모바일 UX 저하
위험:
- WebView UI가 모바일에서 답답하게 느껴질 수 있음

대응:
- 1단계는 속도 우선
- Voice/Chatter/Schedules를 우선 네이티브화

### 13.3. 브리지 과도 의존
위험:
- 모든 것을 브리지로 처리하면 유지보수가 복잡해짐

대응:
- 브리지는 “디바이스 기능” 중심으로 제한
- 비즈니스 로직은 가능하면 웹/API에 유지

### 13.4. 웹/앱 이중 구현
위험:
- UI와 로직이 이원화될 수 있음

대응:
- Native 전환 대상은 Pod별로 명확히 한정
- 전환 전 공통 domain/api-client 분리

### 13.5. 미들웨어/쿠키 기반 인증과 앱 호환성
위험:
- 현재 웹은 cookie 기반 SSR이므로 앱 인증 연동이 단순하지 않음

대응:
- 초기 앱은 WebView 인증 유지
- 후속 단계에서만 세션 브리지 검토

---

## 14. 구현 전 선행 정리 권장

앱 하네스 도입 전에 웹 코드에서 아래를 정리하면 이후 전환 비용이 크게 줄어듭니다.

### 14.1. UI와 도메인 로직 분리
예:
- 일정 생성/수정 로직
- 문서 워크플로우 상태 전이
- 채터 메시지 조합
- 회의록 정제 요청

### 14.2. 브라우저 전용 코드 경계 설정
예:
- `window`, `document`, `confirm`
- Web 전용 녹음/모달/캘린더 라이브러리

### 14.3. 앱 브리지 진입점 표준화
웹에서 앱 기능을 호출할 때 사용할 공통 helper를 정의

---

## 15. 권장 초기 작업 단위

### 작업 1
`apps/mobile` Expo 셸 생성 및 기본 탭 구조 구축

### 작업 2
공통 WebView Harness 컴포넌트 작성

### 작업 3
Web Harness URL 매핑 규격 정의

### 작업 4
Bridge 이벤트 스키마 정의

### 작업 5
Pod-D Native Recorder 우선 실험

---

## 16. 최종 권장안

WorkPresso는 현재 웹 구현 자산이 충분하므로,
모바일 앱은 아래 전략이 가장 현실적입니다.

> **Expo 기반 App Shell + Web Harness + Pod-D / Pod-E 우선 네이티브 추출**

이 방식은 출시 속도, 유지보수 비용, 기능 누락 방지, 향후 확장성을 모두 균형 있게 만족합니다.

---

## 17. 다음 담당 권장

- **1차 구현 담당**: Frontend Developer
- **인증/세션/브리지 정책 협업**: Backend Developer

