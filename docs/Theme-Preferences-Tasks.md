# Theme Preferences System (테마 환경설정 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Theme Preferences 기능의 세부 구현 항목을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 전역 테마 시스템 및 다크 모드 기반 구축

**목표:** `Default`, `Light`, `Dark` 3가지 모드를 지원하는 전역 테마 시스템과 다크 모드 디자인 토큰을 구축

- [ ] **Design Spec**: [docs/design_theme.txt](/home/siho/workspace/AppProject/workpresso/docs/design_theme.txt)의 다크 모드 명세를 기준으로 라이트/다크 토큰 적용 범위 확정
- [ ] **Frontend (Theme Provider)**: 앱 전역에서 `data-theme` 또는 동등한 방식으로 테마를 제어하는 클라이언트 테마 관리 로직 구현
- [ ] **Frontend (Theme Detection)**: `Default` 선택 시 `prefers-color-scheme`를 감지하여 시스템 설정을 반영하는 로직 구현
- [ ] **Frontend (Persistence)**: 사용자의 테마 선택값(`default`, `light`, `dark`)을 `localStorage`에 저장하고 초기 로드 시 복원
- [ ] **Frontend (Hydration UX)**: 첫 렌더링 전에 루트 테마 속성을 주입해 FOUC(테마 깜빡임)를 최소화
- [ ] **Design Theme**: `globals.css`, Tailwind 토큰, 주요 표면 색상에 다크 모드용 `background`, `surface`, `text`, `border` 스타일 적용

## 🧑‍💻 Part 2: 헤더 드롭다운 Theme UI 및 상호작용

**목표:** 사용자 드롭다운 안에서 `Theme` 항목을 통해 현재 모드를 표시하고 즉시 변경할 수 있도록 구성

- [ ] **Spec Alignment**: [docs/Theme-Preferences-Spec.md](/home/siho/workspace/AppProject/workpresso/docs/Theme-Preferences-Spec.md) 기준으로 헤더 드롭다운 UI 구조 확정
- [ ] **Frontend (UI)**: 헤더 아바타 드롭다운 메뉴에 `Theme` 메뉴 아이템 추가
- [ ] **Frontend (Layout)**: `Theme` 라벨은 좌측 정렬, 현재 선택값 `Default | Light | Dark`는 우측 정렬로 표시
- [ ] **Frontend (UI)**: `Theme` 클릭 시 서브메뉴 또는 동등한 패턴으로 `Default`, `Light`, `Dark` 선택 인터페이스 구현
- [ ] **Frontend (State)**: 선택 즉시 전역 테마가 반영되도록 드롭다운 선택값과 테마 적용 로직 연결
- [ ] **Accessibility**: 키보드 탐색, 포커스 상태, 선택 상태, 스크린리더 레이블을 포함한 접근성 검증
- [ ] **Cleanup**: 기존 `Profile Settings` 중심의 설정 창/모달 전제를 제거하고 헤더 드롭다운 중심 플로우로 명세와 UI를 일치시킴
