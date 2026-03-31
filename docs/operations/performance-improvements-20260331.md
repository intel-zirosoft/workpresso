# 2026-03-31 성능 개선 작업 보고서

## 목적
탭 전환 시 사용자가 체감하는 랙을 줄이고, 클릭 직후 즉시 반응하는 화면 전환 경험을 제공하는 것을 목표로 했다.

## 문제 인식
기존 구조에서는 `/schedules`, `/documents`, `/chatter` 탭 진입 시 무거운 클라이언트 컴포넌트가 한 번에 로드되면서 다음과 같은 문제가 있었다.

- 탭 클릭 직후 화면이 잠시 멈춘 것처럼 보임
- 로딩 상태가 즉시 보이지 않아 체감상 더 느리게 느껴짐
- 대형 클라이언트 UI(`FullCalendar`, `DocumentWorkspace`, `ChatterWorkspace`)의 초기 진입 비용이 큼
- 헤더와 사이드바가 동일한 사용자 프로필을 중복 조회함

## 적용한 개선 사항

### 1. `/schedules` 탭 최적화
대상 파일:
- `apps/web/src/app/(schedules)/schedules/page.tsx`
- `apps/web/src/app/(schedules)/schedules/loading.tsx`
- `apps/web/src/app/(schedules)/_components/calendar-view.tsx`
- `apps/web/src/app/(schedules)/_components/full-calendar-client.tsx`

적용 내용:
- `schedules/page.tsx`에서 `"use client"`를 제거해 페이지 shell을 서버 컴포넌트로 전환
- route-level `loading.tsx`를 추가해 탭 클릭 직후 skeleton/loader가 즉시 표시되도록 변경
- 무거운 `FullCalendar`를 `dynamic(..., { ssr: false })`로 분리
- `CalendarView`는 유지하되 실제 대형 달력만 지연 로드하도록 구조화

기대 효과:
- 일정 탭 진입 시 공백 시간 감소
- 즉시 로딩 피드백 제공
- 무거운 달력 JS의 초기 평가 비용 분산

---

### 2. `/documents` 탭 최적화
대상 파일:
- `apps/web/src/app/(docs)/documents/page.tsx`
- `apps/web/src/app/(docs)/documents/loading.tsx`
- `apps/web/src/features/pod-a/components/document-workspace-entry.tsx`

적용 내용:
- `/documents` page를 얇은 엔트리로 유지
- route-level `loading.tsx` 추가
- 대형 `DocumentWorkspace`를 `dynamic(..., { ssr: false })`로 지연 로드

기대 효과:
- 문서 탭 클릭 직후 즉시 skeleton 표시
- 대형 문서 워크스페이스 번들 로드 시점을 뒤로 미룸
- 초기 진입 체감 개선

---

### 3. `/chatter` 탭 최적화
대상 파일:
- `apps/web/src/app/(chatter)/chatter/page.tsx`
- `apps/web/src/app/(chatter)/chatter/loading.tsx`
- `apps/web/src/features/pod-e/components/chatter-workspace-entry.tsx`

적용 내용:
- `/chatter` page를 얇은 엔트리로 유지
- route-level `loading.tsx` 추가
- 대형 `ChatterWorkspace`를 `dynamic(..., { ssr: false })`로 지연 로드

기대 효과:
- 채터 탭 진입 시 즉시 반응하는 UI 제공
- 채널/메시지 UI의 초기 JS 평가 비용 분산
- 탭 전환 체감 랙 감소

---

### 4. 셸 레벨 중복 fetch 완화
대상 파일:
- `apps/web/src/components/shared/sidebar.tsx`
- `apps/web/src/components/shared/header.tsx`
- `apps/web/src/features/settings/hooks/use-current-user.ts`
- `apps/web/src/app/api/users/me/route.ts`

적용 내용:
- 헤더/사이드바가 각각 따로 수행하던 `auth.getUser()` + `getUserProfile()` 흐름을 단일 `/api/users/me` 조회로 통합
- `useCurrentUser()` 훅을 추가해 공통 React Query 캐시(`["currentUser"]`)를 사용하도록 정리
- `/api/users/me` 응답에 `email`, `role`을 포함해 헤더/사이드바가 한 번의 요청으로 필요한 정보를 모두 사용할 수 있게 변경

기대 효과:
- 초기 셸 렌더 시 사용자 정보 요청 수 감소
- 헤더/사이드바 간 사용자 정보 캐시 일관성 확보
- 로그인 상태 기반 UI 업데이트를 단일 쿼리 기준으로 정리

## 커밋 정보
이번 성능 개선 중 1차 묶음 커밋:

- `84ea89e`
- `perf: 주요 탭 진입 지연 로드와 로딩 UI 적용`

참고:
- 헤더/사이드바 공통 사용자 조회 통합은 위 커밋 이후 추가 적용된 2차 최적화이다.

## 검증 결과
다음 범위에 대해 새 타입 오류가 없는 것을 확인했다.

- schedules 관련 신규/변경 파일
- documents 관련 신규/변경 파일
- chatter 관련 신규/변경 파일
- sidebar/header 관련 변경 파일

단, 전체 타입체크는 기존 별도 이슈로 인해 여전히 실패한다.

기존 이슈:
- `src/features/pod-a/services/document-server.test.ts`
- `viewerApprovalStatus` 누락

즉, 이번 성능 개선 변경 자체가 새로운 타입 오류를 만든 것은 아니다.

## 사용자 경험 관점 기대 변화
- 탭 클릭 직후 아무 반응이 없는 느낌이 줄어듦
- 로딩 중 상태가 즉시 표시되어 심리적 대기 시간이 감소
- 무거운 화면의 초기 진입이 더 자연스럽게 느껴짐

## 다음 개선 후보
추가로 검토할 수 있는 항목:

1. `header.tsx`의 사용자 세션/프로필 처리 서버 주입 검토
2. `DocumentWorkspace`, `ChatterWorkspace` 내부를 더 작은 client island로 분해
3. 최초 진입 데이터 일부를 서버에서 선패치해 hydration 이전에도 기본 콘텐츠 제공
4. `FullCalendar` 외 대형 editor/패널도 단계적으로 dynamic import 적용

## 요약
이번 작업은 SSR 전환만을 목표로 하기보다, 실제 체감 랙의 원인이던 대형 클라이언트 컴포넌트 초기 진입 비용을 줄이는 방향으로 진행했다.

핵심 전략은 다음과 같다.
- route-level loading 추가
- 대형 클라이언트 컴포넌트 지연 로드
- 페이지 shell은 가능한 한 얇게 유지
- 셸 레벨 중복 fetch 완화

이를 통해 `/schedules`, `/documents`, `/chatter` 탭의 초기 전환 경험을 우선 개선했다.
