# Workpresso Theme Preferences Specification

## 목적

별도의 설정 창 없이, 헤더 우측 상단 사용자 드롭다운 메뉴 안에서 테마를 빠르게 확인하고 변경할 수 있도록 합니다.

## 진입 방식

- Primary Entry: 헤더 아바타 드롭다운 메뉴 내부의 `Theme` 메뉴 아이템
- 별도 `Settings`, `Preferences`, `Modal`, `Sheet`, 독립 설정 페이지는 초기 범위에서 제외합니다.

## Theme 메뉴 아이템 명세

- 위치: 사용자 프로필 정보 영역 바로 아래의 드롭다운 메뉴 아이템
- 레이아웃: 좌측에 `Theme`, 우측에 현재 선택값 `Default`, `Light`, `Dark`
- 정렬: `Theme`는 기본 좌측 정렬, 현재 선택값은 우측 정렬
- 예시 표시: `Theme                         Default`
- 상태: 기본, 호버, 포커스, 열림(active)
- 역할: 현재 테마 상태를 요약해서 보여주는 엔트리 포인트

## 테마 선택 동작

- 선택 가능 옵션: `Default`, `Light`, `Dark`
- `Default`: 브라우저 또는 OS의 `prefers-color-scheme` 설정을 따릅니다.
- `Light`: 항상 라이트 테마를 사용합니다.
- `Dark`: 항상 다크 테마를 사용합니다.
- 옵션 선택 즉시 전역 테마를 변경합니다.
- 새로고침 이후에도 마지막 선택 상태를 유지합니다.

## 인터랙션 패턴

- 1안 권장: `Theme` 메뉴 아이템 클릭 시 서브메뉴를 열고 `Default`, `Light`, `Dark` 중 하나를 선택
- 2안 대안: 클릭할 때마다 `Default -> Light -> Dark -> Default` 순서로 순환
- 초기 구현은 사용성과 예측 가능성을 위해 1안(Submenu) 우선

## 레이아웃 예시

```txt
Theme                         Default
```

또는 서브메뉴 사용 시:

```txt
Theme                         Default >
```

## 상태 및 예외 처리

- 저장된 값이 없으면 기본 상태는 `Default`
- `Default` + 시스템 라이트: 라이트 테마 적용
- `Default` + 시스템 다크: 다크 테마 적용
- 저장 실패: 현재 세션에는 즉시 반영하고, 다음 동기화 시 재시도
- 초기 하이드레이션: 테마 깜빡임(FOUC)을 줄이기 위해 앱 렌더 전에 루트 테마 값을 먼저 주입

## 저장 정책

- 초기 구현: `localStorage`에 `default | light | dark` 값 저장
- 추후 확장: 로그인 사용자에 한해 프로필 설정과 동기화 가능하도록 확장

## User Profile 연계 방향

- 현재 단계에서는 User Profile 기능과 분리해 독립적으로 동작
- 추후 User Profile이 구현되면 동일한 테마 값 소스를 공유하거나 `Profile > Preferences`에서 같은 설정을 노출
- 핵심 원칙: 지금은 드롭다운에서 즉시 변경 가능해야 하며, 별도 설정 화면 의존성을 만들지 않음
