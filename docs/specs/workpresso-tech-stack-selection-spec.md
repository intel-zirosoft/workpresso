# WorkPresso 기술 스택 및 라이브러리 선정 명세서

## 문서 목적
본 문서는 WorkPresso 프로젝트의 기술 스택과 주요 라이브러리 선정 내용을 **웹(Web)** 과 **앱(App)** 으로 구분해 정리한 명세서입니다.

## 기준 소스
- 웹: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.js`, `apps/web/tailwind.config.js`
- 앱: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/src/harness/webview/WebViewContainer.tsx`

---

# 1. 웹(Web) 기술 스택 및 선정 명세

## 1-1. 웹 플랫폼 개요
WorkPresso 웹은 **Next.js 기반의 React 웹 애플리케이션**으로 구성되어 있으며, App Router 구조를 사용해 화면 렌더링과 서버 API 라우트를 함께 운영합니다.

## 1-2. 웹 기술 스택 요약

| 구분 | 기술/라이브러리 | 버전 | 선정 이유 |
|---|---|---:|---|
| 웹 프레임워크 | Next.js | 14.2.13 | React 기반 생산성과 App Router 구조, 페이지/서버 라우트 통합 운영에 적합 |
| UI 런타임 | React / React DOM | 18.3.1 | 컴포넌트 기반 UI 개발과 Next.js 생태계의 안정적 조합 |
| 언어 | TypeScript | 5.6.2 | 정적 타입 기반 유지보수성과 안정성 확보 |
| 스타일링 | Tailwind CSS | 3.4.12 | 유틸리티 클래스 기반의 빠른 UI 개발과 일관된 디자인 시스템 구성에 적합 |
| UI 컴포넌트 | Radix UI | 개별 패키지 사용 | Dialog, Tabs, Dropdown 등 접근성 중심의 헤드리스 UI 구성에 적합 |
| 디자인 보조 | shadcn/ui 패턴 기반 구성 | 프로젝트 내부 사용 | Tailwind + Radix 조합으로 일관된 컴포넌트 생산성 확보 |
| 상태/서버 캐시 | TanStack React Query | 5.56.2 | 클라이언트 데이터 패칭, 캐시, 동기화 관리에 적합 |
| 백엔드/BaaS | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | 0.5.1 / 2.45.4 | 인증, 데이터 접근, SSR 환경 연동을 단순화 |
| 폼 처리 | React Hook Form | 7.53.0 | 폼 상태 관리와 성능 측면에서 효율적 |
| 폼 검증 | Zod / `@hookform/resolvers` | 3.23.8 / 3.9.0 | 런타임 스키마 검증과 폼 검증 통합에 적합 |
| AI SDK | `ai`, `openai`, `@ai-sdk/openai` | 4.1.0 / 4.61.0 / 1.3.24 | 채팅/스트리밍 및 모델 호출 추상화에 활용 |
| 일정 UI | FullCalendar | 6.1.20 | 캘린더 중심의 일정 관리 화면 구성에 적합 |
| 날짜 처리 | date-fns | 3.6.0 | 경량 날짜 유틸리티로 일정/시간 처리에 유리 |
| 에디터/마크다운 | react-markdown, remark-gfm | 9.0.1 / 4.0.1 | 문서/AI 응답 표시와 GFM 스타일 렌더링에 적합 |
| 오디오 | react-media-recorder, wavesurfer.js | 1.6.6 / 7.8.2 | 음성 녹음 및 파형 시각화 기능 지원 |
| 아이콘 | lucide-react | 0.441.0 | 일관된 아이콘 시스템 제공 |
| HTTP 통신 | axios | 1.14.0 | API 호출 유틸리티 용도 |
| 테스트(단위/통합) | Vitest | 4.1.2 | 빠른 테스트 실행과 TS 친화적 환경 |
| 테스트(E2E) | Playwright | 1.58.2 | 사용자 시나리오 기반 웹 E2E 검증에 적합 |
| 코드 품질 | ESLint, Prettier | 8.57.0 / 3.3.3 | 코드 스타일과 정적 품질 관리 |

## 1-3. 웹 선정 상세

### A. Next.js 선정 이유
- `apps/web/next.config.js` 기준 `reactStrictMode: true`, `output: "standalone"` 설정을 사용합니다.
- 화면 렌더링과 API 라우트를 하나의 프로젝트에서 운영할 수 있어 관리 효율이 높습니다.
- WorkPresso는 문서, 일정, 채팅, 설정 등 업무 기능이 밀집된 구조이므로 App Router 기반의 화면/서버 통합 구성이 적합합니다.

### B. Tailwind CSS + Radix UI 선정 이유
- `apps/web/tailwind.config.js`에서 프로젝트 전역 디자인 토큰과 container, color, font, radius, shadow를 직접 관리합니다.
- Tailwind는 빠른 화면 조립과 디자인 일관성 유지에 유리합니다.
- Radix UI는 접근성을 확보하면서도 프로젝트 디자인에 맞게 커스터마이징하기 쉬운 구조입니다.
- 이 조합은 WorkPresso처럼 화면 수가 많고 관리 화면이 많은 업무용 서비스에 적합합니다.

### C. React Query 선정 이유
- WorkPresso는 사용자/문서/일정/채널 등 서버 상태를 자주 조회하고 갱신합니다.
- React Query는 캐시, 재요청, 로딩 상태, 뮤테이션 처리에 강점이 있어 실무형 데이터 흐름에 적합합니다.

### D. Supabase 선정 이유
- 인증, 사용자 세션, 데이터 저장소 접근을 빠르게 구축할 수 있습니다.
- `@supabase/ssr` 사용으로 Next.js 서버 환경과의 연결이 자연스럽습니다.
- WorkPresso는 문서/일정/회의록/채팅 등 다수의 업무 데이터를 다루므로 BaaS 기반 생산성이 높습니다.

### E. Zod + React Hook Form 선정 이유
- 문서 작성, 설정, 일정 생성 등 입력 폼이 많은 서비스 특성과 잘 맞습니다.
- 타입과 검증 규칙을 함께 관리할 수 있어 유지보수성이 높습니다.

### F. AI 및 업무 도우미 스택 선정 이유
- `ai`, `openai`, `@ai-sdk/openai` 조합은 Pod-C 같은 AI 기능에서 스트리밍 응답과 모델 호출 유연성을 제공합니다.
- WorkPresso는 단순 CRUD 외에 RAG, 업무 도우미, 회의록 정제 등 AI 기능이 핵심이므로 별도 AI SDK 계층이 필요합니다.

### G. FullCalendar 선정 이유
- 일정이 핵심 업무 축인 서비스 특성상 월/주 단위 시각화가 중요합니다.
- FullCalendar는 상호작용 캘린더 구축에 적합합니다.

### H. 테스트 도구 선정 이유
- Vitest는 빠른 단위/통합 테스트 수행에 적합합니다.
- Playwright는 실제 브라우저 기반 E2E 검증이 가능해 문서, 채팅, 일정 등 핵심 사용자 플로우 확인에 적합합니다.

## 1-4. 웹 아키텍처 판단
웹은 단순 프론트엔드가 아니라 다음 성격을 동시에 가집니다.
- 사용자 UI 제공
- Next.js API Route 기반 BFF 역할
- Supabase 연동 허브
- AI 기능 진입점

따라서 웹 스택은 **프론트엔드 프레임워크 + 서버 기능 + AI 연동 + 업무형 UI 라이브러리** 조합으로 선정된 것으로 볼 수 있습니다.

---

# 2. 앱(App) 기술 스택 및 선정 명세

## 2-1. 앱 플랫폼 개요
WorkPresso 앱은 **Expo 기반 React Native 앱**이며, 탭 네비게이션과 WebView를 활용해 웹 기능을 모바일에 통합하는 구조입니다.

## 2-2. 앱 기술 스택 요약

| 구분 | 기술/라이브러리 | 버전 | 선정 이유 |
|---|---|---:|---|
| 모바일 프레임워크 | Expo | ~54.0.7 | React Native 개발 생산성, 실행/배포 편의성 확보 |
| 모바일 UI 런타임 | React Native | 0.81.5 | iOS/Android 크로스플랫폼 구현의 기본 런타임 |
| 언어 | TypeScript | ~5.9.2 | 모바일 코드 안정성과 유지보수성 확보 |
| 앱 라우팅 | Expo Router | ~6.0.23 | 파일 기반 라우팅과 딥링크 처리에 적합 |
| 네비게이션 | React Navigation (`@react-navigation/native`, `bottom-tabs`) | 7.x | 탭 중심 모바일 내비게이션 구성에 적합 |
| 안전 영역 | react-native-safe-area-context | ~5.6.0 | 노치/상단바/하단 홈 인디케이터 대응 |
| 화면 최적화 | react-native-screens | ~4.16.0 | 네이티브 화면 성능 및 네비게이션 최적화 |
| 상태바 | expo-status-bar | ~3.0.9 | 플랫폼별 상태바 제어 단순화 |
| 딥링크 | expo-linking | ~8.0.11 | 앱 스킴 기반 딥링크 처리에 적합 |
| 앱 설정 접근 | expo-constants | ~18.0.13 | Expo 런타임/환경 설정값 접근 |
| 웹 연동 | react-native-webview | 13.15.0 | 기존 웹 기능을 모바일에서 재사용하는 핵심 수단 |
| 웹 지원 | react-dom, react-native-web | 19.1.0 / ~0.21.0 | Expo의 웹 타깃 실행 지원 |

## 2-3. 앱 선정 상세

### A. Expo 선정 이유
- `apps/mobile/app.json` 기준 Expo 프로젝트로 구성되어 있습니다.
- 초기 셋업, 실행, 테스트, 디바이스 연동이 빠릅니다.
- 모바일 전용 기능을 점진적으로 붙여가기에 적합합니다.

### B. Expo Router 선정 이유
- `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`에서 파일 기반 라우팅과 탭 구조를 사용합니다.
- 딥링크 수신 후 특정 탭 또는 웹 화면으로 이동시키는 구조와 잘 맞습니다.
- `typedRoutes` 활성화로 라우팅 안정성을 높였습니다.

### C. React Navigation 선정 이유
- 탭 중심의 업무 앱 구조와 적합합니다.
- 홈, 채터, 일정, 문서, 도우미, 음성 등 주요 기능이 하단 탭으로 구성되어 있어 사용성이 높습니다.

### D. WebView 중심 선정 이유
- `apps/mobile/src/harness/webview/WebViewContainer.tsx`, `WebScreen.tsx` 기준 앱은 웹 기능을 적극적으로 재사용합니다.
- 채팅, 문서, 일정 등 탭이 실제로 웹 경로를 로드하는 구조입니다.
- 이 방식은 웹의 기능 성숙도를 모바일에서 빠르게 활용할 수 있게 해줍니다.
- 즉, 앱은 완전한 별도 네이티브 재구현보다 **웹 자산 재사용 + 모바일 셸 강화** 전략에 가깝습니다.

### E. Safe Area / Screen 최적화 선정 이유
- 업무 앱은 장시간 사용과 다양한 기기 대응이 중요합니다.
- 안전 영역 처리와 네비게이션 성능 최적화는 기본 품질 요소이므로 필수 채택이 적절합니다.

### F. Expo Linking 및 딥링크 선정 이유
- `scheme: "workpresso"` 설정과 딥링크 처리 로직을 통해 앱 내부 탭/웹 화면 전환이 가능합니다.
- 외부 진입과 내부 라우팅 연결이 필요한 업무 앱 특성과 맞습니다.

## 2-4. 앱 아키텍처 판단
모바일 앱은 다음과 같은 구조적 특징을 가집니다.

1. **Expo/React Native 기반 앱 셸 제공**
2. **Expo Router + Tab Navigation 기반 모바일 UX 제공**
3. **WebView로 웹 기능을 재사용**
4. **딥링크와 브리지로 모바일-웹 연결 강화**

즉 WorkPresso 앱은 **완전 네이티브 우선 앱이라기보다, 웹 중심 서비스를 모바일 앱 셸로 감싸고 필요한 모바일 기능을 점진적으로 확장하는 전략형 구조**로 판단됩니다.

---

# 3. 웹과 앱의 기술 선정 방향 비교

| 항목 | 웹(Web) | 앱(App) |
|---|---|---|
| 핵심 프레임워크 | Next.js | Expo + React Native |
| 주된 역할 | 업무 기능의 중심 구현 | 모바일 접근성과 앱 셸 제공 |
| UI 구성 방식 | Tailwind + Radix 기반 컴포넌트 | React Native UI + WebView 혼합 |
| 데이터/서버 연동 | Supabase + API Route + React Query | WebView를 통한 웹 기능 재사용 + 일부 앱 레벨 제어 |
| AI 기능 연결 | 직접 구현 중심 | 웹 기능을 통해 간접 활용 |
| 주요 전략 | 웹을 중심으로 기능 완성도 확보 | 웹 기능을 모바일에서 빠르게 재사용 |

---

# 4. 결론
WorkPresso의 기술 스택은 다음 방향으로 정리할 수 있습니다.

- **웹은 기능 중심의 메인 업무 플랫폼**으로 설계되었습니다.
  - Next.js, React, Supabase, Tailwind, React Query, Zod, AI SDK 조합을 사용해
  - 문서/일정/채팅/AI 기능을 빠르게 통합했습니다.

- **앱은 모바일 접근성과 재사용성을 높이기 위한 모바일 셸 전략**으로 설계되었습니다.
  - Expo, Expo Router, React Navigation, WebView를 통해
  - 웹 기능을 최대한 재사용하면서 모바일 UX를 제공합니다.

따라서 WorkPresso의 기술 스택은
**웹의 생산성과 기능 완성도를 우선 확보하고, 앱은 WebView 기반 하이브리드 전략으로 확장성 있게 구성한 선택**이라고 정리할 수 있습니다.
