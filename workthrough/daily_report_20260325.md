# 📅 업무 일지 (2026-03-25)

오늘 진행된 Pod-C 중심의 AI 에이전트 개발 및 시스템 최적화 작업 내역입니다.

---

## 🚀 주요 성과

### 1. 🤖 AI 에이전트 핵심 기능 구현 (Pod-C)
*   **기술 스택 확정**: 기존 FastAPI 방식 대신 Next.js와 통합이 우수한 **Vercel AI SDK**를 채택하여 개발 효율성 극대화.
*   **실시간 채팅 UI**: `Dusty Blue` 테마와 `rounded-pill` 스타일을 적용한 현대적인 스트리밍 채팅 인터페이스 구축.
*   **RAG (지식 기반 응답)**: OpenAI 임베딩과 Supabase `pgvector`를 결합하여 내부 문서를 참고해 답변하는 시스템 구현.
*   **Function Calling (일정 연동)**: 대화 중 사용자의 의도를 파악하여 실제로 `schedules` 테이블에 일정을 등록하는 도구 연동 완료.

### 2. 📁 지식 베이스(Knowledge Base) 관리 체계 구축
*   **운영용 데이터 저장소**: `src/features/pod-c/knowledge-base/` 폴더를 생성하여 마크다운 기반의 지식 문서 관리.
*   **자동 동기화 API**: 로컬 마크다운 파일을 읽어 벡터 DB로 자동 변환 및 업서트하는 관리자용 API 구현.
*   **테스트 환경**: IT 회사를 가정한 실무 가이드라인 데이터 주입 및 테스트 완료.

### 3. 🌐 현지화 및 UI 통합
*   **전면 한국어화**: 사이드바 메뉴명, 메타데이터, 채팅 인터페이스 및 AI 시스템 프롬프트를 모두 한국어로 최적화.
*   **메뉴 통합**: 사이드바에 '업무 비서' 메뉴를 추가하여 접근성 향상.

### 4. 🛠️ CI/CD 시스템 최적화 (Gemini AI Reviewer)
*   **404 모델 오류 해결**: API 키 권한에 따라 최적의 모델(`gemini-flash-latest` 등)을 자동으로 선택하는 '스마트 모델 선택 로직' 도입.
*   **리뷰 품질 강화**: 단순 코드 분석을 넘어 **로직 정확성 검증** 및 **잠재적 버그 탐지** 지침을 프롬프트에 추가.
*   **안정성 개선**: Triple-dot Diff 방식 및 명시적 브랜치 Fetch를 통해 정확한 변경분만 추출하도록 개선.

---

## 📂 생성 및 수정된 주요 파일

| 경로 | 설명 |
| :--- | :--- |
| `apps/web/src/app/(agent)/chat/page.tsx` | 메인 채팅 인터페이스 화면 |
| `apps/web/src/app/api/chat/route.ts` | AI 로직 (RAG + Tool) 실행 엔드포인트 |
| `apps/web/src/app/api/admin/sync-knowledge/route.ts` | 지식 문서 -> 벡터 DB 동기화 API |
| `apps/web/src/features/pod-c/knowledge-base/` | 실제 운영용 지식 문서 저장소 |
| `packages/db/schema.db` | 벡터 검색용 SQL 함수 및 인덱스 추가 |
| `.github/workflows/gemini-pr-review.yml` | 개선된 Gemini AI 코드 리뷰 워크플로우 |
| `docs/daily_report_20260325.md` | 오늘 작업 내용 요약 보고서 (본 파일) |

---

## 📝 향후 계획
1.  **데이터 확장**: `knowledge-base`에 더 많은 실무 문서(프로젝트 기획서, 회의록 등) 추가 및 동기화.
2.  **타 Pod 연동**: 결재 문서(Pod-A), 회의록 요약(Pod-D) 등 다른 모듈과의 API 심화 연동.
3.  **UI 디테일**: 모바일 반응형 대응 및 채팅 이력 저장 기능(DB 연동) 보완.
