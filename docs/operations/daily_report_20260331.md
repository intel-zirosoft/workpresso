# Daily Report — 2026-03-31

<<<<<<< HEAD
## 요약
- Pod-C 채팅 라우트를 OpenRouter 직접 호출 경로 중심으로 재정비하고, Preview 환경/스트리밍 이슈 대응을 보강했다.
- 웹 주요 탭(`/schedules`, `/documents`, `/chatter`)의 초기 진입 성능을 개선하고, 헤더/사이드바 사용자 조회를 공통 캐시로 통합했다.
- 다크 테마 하드코딩 색상을 토큰 기반으로 정리한 변경을 병합했다.
- `apps/mobile` 기준 Expo Go용 모바일 MVP 하네스를 구축하고 WebView, 브리지, 딥링크, 로그인 이동 흐름을 안정화했다.
- 모바일 전환 계획/하네스 설계/시연 체크리스트/API 명세 확장 문서를 정리했다.

## 오늘 반영된 주요 변경

### 1. Pod-C 채팅 경로 안정화
- 관련 커밋:
  - `dba1a04` `fix: Preview 환경에서 채팅 스트림 오류 메시지 노출 강화`
  - `314e222` `fix: OpenRouter 채팅 경로를 비스트리밍 응답으로 우회`
  - `b2483dc` `fix: Pod-C 채팅을 OpenRouter 직접 호출 경로로 전환`
- 주요 내용:
  - Preview 환경에서 채팅 실패 원인을 더 드러나게 조정
  - 스트리밍 경로 문제를 줄이기 위해 비스트리밍 우회 적용
  - 채팅 API를 OpenRouter 직접 호출 경로 중심으로 재정리
- 영향 파일:
  - `apps/web/src/app/api/chat/route.ts`
  - `apps/web/src/app/api/chat/route.test.ts`
  - `apps/web/src/app/api/chat/chat-schedule.integration.test.ts`

### 2. 웹 UX/성능 개선
- 관련 커밋:
  - `84ea89e` `perf: 주요 탭 진입 지연 로드와 로딩 UI 적용`
  - `0393ac7` `perf: 헤더와 사이드바 사용자 조회를 공통 캐시로 통합`
  - `51a6df8` `perf: 문서 워크스페이스 초기 로드 비용 축소`
  - `d000063` `fix: 문서 탭 선로딩과 테스트 타입 오류 수정`
- 주요 내용:
  - `/schedules`, `/documents`, `/chatter`에 route-level loading UI 추가
  - 무거운 워크스페이스/달력 컴포넌트를 지연 로드하도록 분리
  - 헤더/사이드바의 사용자 정보 조회를 `/api/users/me` + 공통 React Query 캐시로 통합
  - 문서 탭 선로딩과 `viewerApprovalStatus` 관련 테스트 타입 오류 보정
- 참고 문서:
  - `docs/operations/performance-improvements-20260331.md`

### 3. 다크 테마 토큰 정리 및 병합
- 관련 커밋:
  - `ba7ffc3` `fix(theme): replace hardcoded dark-mode colors with tokens`
  - `1c261a6` `Merge pull request #73 from intel-zirosoft/Dark-Theme`
- 주요 내용:
  - 다크 모드 하드코딩 색상을 토큰 기반으로 치환
  - 스케줄/설정/문서/채터/음성 관련 UI와 공통 스타일을 함께 정리
  - `globals.css`, `tailwind.config.js` 중심의 테마 일관성 강화

### 4. 모바일 MVP 하네스 구축 및 안정화
- 관련 커밋:
  - `c6255cd` `feat(mobile): Expo Go용 WebView UX 안정화와 안드로이드 딥링크 기본 처리 추가`
  - `a0a08f2` `feat(mobile): 브리지 검증 로그와 개발용 확인 패널 추가`
  - `190dcff` `fix(mobile): 로그인 후 기능 미동작 원인 진단 가시성 추가`
  - `11c22af` `fix(mobile): 로그인 버튼 이동 시 WebView 라우트 전환 처리 보강`
  - `1f0de7a` `docs(mobile): 안드로이드 Expo Go 시연 체크리스트 정리`
- 주요 내용:
  - `apps/mobile`에 Expo Router 탭 구조와 WebView 하네스 기본 뼈대 추가
  - Android 기준 외부 링크/딥링크/뒤로가기/새로고침 흐름 보강
  - 웹↔앱 브리지 타입/핸들러/주입 스크립트 구성
  - 개발용 브리지 확인 패널과 진단 로그 추가
  - 로그인 버튼 이동 시 WebView 라우트 전환 처리 개선
- 관련 문서:
  - `apps/mobile/README.md`
  - `docs/specs/Mobile_App_MVP_Demo_Checklist.md`

### 5. 오늘 작성/확장한 문서 작업
- 커밋 반영 문서:
  - `docs/operations/performance-improvements-20260331.md`
  - `docs/specs/Mobile_App_MVP_Demo_Checklist.md`
- 현재 로컬에서 추가 작성 중인 문서:
  - `docs/specs/Mobile_App_Conversion_MVP_Deadline_Plan.md`
  - `docs/specs/Mobile_App_Harness_Adoption_Spec.md`
- 현재 로컬에서 대폭 확장 중인 문서:
  - `docs/api/Workpresso_API_명세서.md`
    - Draft 형식에서 현재 구현 기준의 Pod/API별 상세 명세로 확장 중

## 참고 커밋 목록
- `11c22af` fix(mobile): 로그인 버튼 이동 시 WebView 라우트 전환 처리 보강
- `190dcff` fix(mobile): 로그인 후 기능 미동작 원인 진단 가시성 추가
- `1f0de7a` docs(mobile): 안드로이드 Expo Go 시연 체크리스트 정리
- `a0a08f2` feat(mobile): 브리지 검증 로그와 개발용 확인 패널 추가
- `c6255cd` feat(mobile): Expo Go용 WebView UX 안정화와 안드로이드 딥링크 기본 처리 추가
- `d000063` fix: 문서 탭 선로딩과 테스트 타입 오류 수정
- `51a6df8` perf: 문서 워크스페이스 초기 로드 비용 축소
- `0393ac7` perf: 헤더와 사이드바 사용자 조회를 공통 캐시로 통합
- `84ea89e` perf: 주요 탭 진입 지연 로드와 로딩 UI 적용
- `ba7ffc3` fix(theme): replace hardcoded dark-mode colors with tokens
- `b2483dc` fix: Pod-C 채팅을 OpenRouter 직접 호출 경로로 전환
- `314e222` fix: OpenRouter 채팅 경로를 비스트리밍 응답으로 우회
- `dba1a04` fix: Preview 환경에서 채팅 스트림 오류 메시지 노출 강화

## 현재 로컬 상태
보고서 작성 직전 `git status --short` 기준:

- 수정 중:
  - `apps/web/src/components/shared/header.tsx`
  - `docs/api/Workpresso_API_명세서.md`
- 신규(미추적):
  - `docs/specs/Mobile_App_Conversion_MVP_Deadline_Plan.md`
  - `docs/specs/Mobile_App_Harness_Adoption_Spec.md`

## 메모
- 오늘 로그에는 `6b179d0` (`AA`)처럼 의미가 축약된 임시성 커밋도 포함되어 있어, 본 보고서에서는 작업 목적이 분명한 변경 위주로 재분류했다.
- 이 보고서는 2026년 3월 31일 커밋 로그, 현재 워킹트리 상태, 관련 문서를 기준으로 정리했으며 보고서 작성 과정에서 추가 빌드/테스트는 별도로 실행하지 않았다.
=======
아래 내용은 2026-03-31 기준 깃 로그와 현재 작업 맥락을 기준으로 정리했다.  
리퀴드글래스 테마 시도는 별도 커밋으로 명확히 남아 있지 않아, 메모성 항목으로 함께 기록했다.

## 오늘의 목표
- 리퀴드글래스 테마 방향을 시험해 보고, 가능하면 UI 톤을 한 단계 끌어올리기
- 다크모드에서 남아 있던 하드코딩 색상 노가다를 줄이고 토큰 기반으로 정리하기
- Pod A의 Slack API 상호작용 흐름을 안정화하고, Jira/Slack 문서 알림 흐름을 실사용 가능하게 만들기

## 실제로 한 일

### 1. 리퀴드글래스 테마 시도 후 보류
- 테마 방향 자체는 만져봤지만, 오늘 기준으로는 완성도 있게 밀어붙이지 못해 최종 반영까지는 가지 않았다.
- 대신 바로 유지보수 효과가 큰 방향으로 우선순위를 바꿔, 다크모드 색상 체계를 토큰화하는 작업으로 선회했다.

### 2. 다크모드 하드코딩 제거
- `apps/web/src/styles/globals.css`, `apps/web/tailwind.config.js`에 `warning`, `info`, `success`, `destructive`, `overlay`, `brand`, `calendar` 계열 토큰을 추가했다.
- 여러 화면과 컴포넌트에서 `text-white` 같은 직접 지정값을 `text-primary-foreground` 같은 토큰 기반 표현으로 치환했다.
- 결과적으로 다크모드 대응을 화면별 수작업이 아니라 공통 토큰 기준으로 맞출 수 있는 기반을 만들었다.

### 3. Pod A Slack 상호작용 로직 변경
- Slack 안에서 바로 승인/반려까지 처리하려던 흐름을 줄이고, Slack은 알림과 링크 전달 중심으로 단순화했다.
- 즉, 방향이 `앱 -> Slack` 단방향 알림 중심으로 바뀌었고, 실제 처리는 WorkPresso에서 확인하도록 정리했다.
- 슬랙 승인 확인 문구도 단계 승인/최종 승인에 맞게 조금 더 분명하게 보강했다.
- 문서 알림에 들어가는 링크도 배포 URL 기준으로 정리해서, Slack에서 눌렀을 때 WorkPresso 쪽으로 바로 이어지도록 맞췄다.

### 4. Slack 승인 워크플로우 안정화 작업
- Slack 인터랙션 라우트와 테스트를 추가했고, 승인 이후 문서 후처리 작업은 `document_side_effect_jobs` 큐로 넘겨 직접 처리 실패가 본 흐름을 덜 흔들도록 정리했다.
- Slack 사용자 매핑 UI도 오늘 작업 흐름 안에서 이어서 정리했다.
- 사용자와 Slack 계정을 연결하는 매핑 UI를 붙였고, 입력 방식도 더 다루기 쉬운 형태로 손봤다.

### 5. 설정/조회 부작용과 기타 체감 개선 정리
- Slack 설정은 `webhookUrl`뿐 아니라 `botToken`만 있어도 활성 상태로 볼 수 있게 보정했다.
- 문서 조회 API에서 후처리 job flush를 제거해, 조회 요청이 의도치 않게 부작용을 일으키지 않도록 정리했다.
- 추가로 탭 전환 성능도 손봤다.
- 일정, 문서, 채터 탭은 무거운 화면을 바로 다 띄우지 않고 지연 로드되도록 바꿨고, 로딩 UI도 같이 붙였다.
- 헤더와 사이드바에서 각각 따로 사용자 정보를 가져오던 부분은 공통 캐시 기반으로 정리했다.
- 문서 워크스페이스 초기 진입 비용도 조금 줄여서 탭 이동 시 체감이 덜 무겁게 느껴지도록 손봤다.

## 발생한 이슈와 해결방법

### 1. Slack에서 들어오는 상호작용이 기대만큼 안정적으로 잡히지 않음
- 문제: Slack 인터랙션 기반 승인/반려 흐름이 불안정했고, 들어오는 요청을 안정적으로 처리하는 데 계속 걸림돌이 있었다.
- 대응: Slack 내 직접 액션을 계속 늘리기보다, WorkPresso 링크 중심의 알림 구조로 단순화했다.
- 대응: 즉시 완전 해결이라기보다, 실패 지점을 줄이는 방향으로 구조를 바꿨다.

### 2. Vercel 재배포를 해도 현상이 동일함
- 문제: 환경 문제 가능성을 의심해 재배포도 시도했다.
- 대응: 재배포만으로는 증상이 바뀌지 않는 것을 확인했고, 배포 문제가 아니라 인터랙션 구조나 설정/수신 경로 쪽을 다시 봐야 한다는 쪽으로 판단을 좁혔다.

### 3. 문서 승인 후 후처리가 본 로직을 흔들 수 있음
- 문제: 승인 처리 중 지식 동기화 같은 후처리가 직접 엮여 있으면, 실패 시 전체 승인 흐름까지 불안정해질 수 있었다.
- 대응: 후처리를 큐(`document_side_effect_jobs`)로 분리하고, 필요 시 fallback만 남겨 본 처리와 부작용을 분리했다.

### 4. 다크모드 색상 수정이 화면별 노가다가 되어 있었음
- 문제: 화면 곳곳에 하드코딩된 색상값이 흩어져 있어서 수정할 때마다 손으로 계속 맞춰야 했다.
- 대응: 공통 토큰을 늘리고 컴포넌트 표현을 토큰 기반으로 바꿔, 이후 수정 포인트를 한곳으로 모았다.

## 느낀 점
- 오늘은 “새 테마를 멋지게 완성”하는 날이라기보다, 실제 서비스에서 계속 발목 잡는 부분을 줄이는 날에 가까웠다.
- 리퀴드글래스처럼 보기 좋은 방향은 잠깐 접었지만, 다크모드 토큰화와 Slack 흐름 단순화처럼 유지보수성과 안정성에 직접 도움 되는 작업은 꽤 의미 있었다.
- 특히 Slack 인터랙션은 배포만 다시 하면 해결될 문제가 아니라는 점이 더 분명해졌고, 구조를 단순화하는 판단이 필요했다.

## 내일 할 일
- Slack에서 들어오는 인터랙션이 왜 안정적으로 잡히지 않는지, 수신 경로와 설정 값을 다시 점검하기
- Pod A 문서 승인 플로우를 WorkPresso 내부 처리 기준으로 한 번 더 검증하기
- 오늘 보류한 리퀴드글래스 테마를 다시 갈지, 아니면 현재 토큰 체계를 다듬는 쪽으로 갈지 방향 결정하기
- Slack/Jira 연동 문서와 실제 동작이 완전히 일치하는지 한 번 더 정리하기
>>>>>>> develop
