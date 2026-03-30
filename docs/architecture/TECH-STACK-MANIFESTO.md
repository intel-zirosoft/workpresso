# WorkPresso Technical Stack & Library Manifesto
<!-- WorkPresso 기술 스택 및 라이브러리 선정 명세서 -->

이 문서는 WorkPresso 프로젝트에 채택된 기술 스택과 라이브러리의 선정 이유(당위성)를 설명합니다. 모든 팀원은 이 철학을 바탕으로 일관성 있는 개발을 진행합니다.

---

## 1. Core Framework: Next.js (App Router)
- **Why?**: 우리 프로젝트의 핵심인 **'수직적 분할(Vertical Slicing)'**을 구현하기에 가장 적합한 도구입니다.
- **Justification**:
  - **Full-stack in One Place**: 한 폴더 내에 UI(`page.tsx`)와 API(`route.ts`)가 공존하여 한 명의 개발자가 기능을 엔드-투-엔드로 빠르게 개발할 수 있습니다.
  - **Server Components (RSC)**: 데이터베이스(Supabase)에 서버에서 직접 접근하여 보안을 강화하고 클라이언트 번들 크기를 줄입니다.
  - **AI Friendly**: Vercel AI SDK와의 완벽한 통합으로 AI 스트리밍 응답 구현이 매우 쉽습니다.

## 2. Styling: Tailwind CSS & shadcn/ui
- **Why?**: 디자인 고민 시간을 최소화하고 **'기능 구현'**에 집중하기 위함입니다.
- **Justification**:
  - **Utility-First**: 별도의 CSS 파일을 만들지 않고 HTML 태그 내에서 즉시 스타일링이 가능하여 개발 속도가 압도적입니다.
  - **shadcn/ui**: Tailwind 기반의 검증된 UI 컴포넌트를 직접 소스 코드로 관리하므로, 파드 간 UI 일관성을 유지하면서도 자유로운 커스텀이 가능합니다.
  - **Design Consistency**: 시맨틱 컬러와 테마 설정을 통해 4명의 팀원이 각자 UI를 짜더라도 하나의 제품처럼 보입니다.

## 3. Backend & Data: Supabase
- **Why?**: 백엔드 인프라 구축 비용을 줄이고 **'AI 및 실시간 기능'**에 역량을 집중하기 위함입니다.
- **Justification**:
  - **PostgreSQL + pgvector**: Pod C의 핵심인 벡터 검색(RAG)을 위해 별도의 벡터 DB 없이 PostgreSQL 내에서 고성능 벡터 연산이 가능합니다.
  - **RLS (Row Level Security)**: 백엔드 코드 작성 없이 DB 레벨에서 사용자별 데이터 접근 권한을 완벽하게 제어하여 보안 사고를 예방합니다.
  - **Storage & Edge Functions**: Pod D의 오디오 파일 저장과 Pod C의 AI 비즈니스 로직 처리를 위한 인프라를 통합 관리합니다.

## 4. Data Flow: TanStack Query & Zod
- **Why?**: **'타입 안정성(Type Safety)'**과 **'사용자 경험(UX)'**을 보장하기 위함입니다.
- **Justification**:
  - **Zod**: 프론트엔드 입력부터 백엔드 DB 저장까지 동일한 스키마로 검증하여 데이터 정합성을 유지합니다.
  - **TanStack Query**: Supabase 서버 데이터의 캐싱, 동기화, 낙관적 업데이트를 처리하여 네트워크 지연을 사용자에게 느끼지 않게 합니다.

## 5. Domain Specific Libraries
각 Pod의 특수한 문제를 해결하기 위해 선정된 최적의 도구들입니다.

| Library | Pod | Justification (당위성) |
| :--- | :--- | :--- |
| **react-markdown** | Pod A | 마크다운 기반 문서 시스템의 표준 렌더러로, 커스텀 컴포넌트 확장이 매우 용이함. |
| **date-fns** | Pod B | 복잡한 시간대(Timezone) 계산과 일정 필터링 로직을 오류 없이 처리하는 검증된 라이브러리. |
| **Vercel AI SDK** | Pod C | OpenAI 등 다양한 LLM의 스트리밍 응답과 Function Calling을 통합 관리하는 최신 표준. |
| **wavesurfer.js** | Pod D | 캔버스를 활용한 오디오 파형 시각화 분야의 사실상 표준으로, 뛰어난 성능과 기능을 제공. |

---

## Conclusion
이 기술 스택의 조합은 **"적은 인원으로, AI와 함께, 매우 빠른 속도로, 고품질의 풀스택 애플리케이션을 만드는 것"**에 최적화되어 있습니다. 팀원 모두가 이 도구들을 숙달하여 기술적 한계 없이 상상을 현실로 만들기를 기대합니다.
