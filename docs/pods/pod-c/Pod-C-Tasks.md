# Pod C: AI & Knowledge Vector (AI 에이전트 및 지식 벡터 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod C의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 채팅 UI 및 스트리밍 API

**목표:** 사용자 친화적인 실시간 AI 채팅 인터페이스와 에지 함수 기반의 응답 처리

- [x] **Backend (Edge Function)**: `Vercel AI SDK`와 `openai-edge`를 활용한 AI 스트리밍 응답 에지 함수 구현
- [ ] **Frontend (UI)**: 사용자와 AI의 메시지 이력을 보여주는 채팅 인터페이스 마크업 구현
- [x] **Frontend (UX)**: 응답 대기 중 로딩 스피너 애니메이션 처리
- [x] **Security**: 클라이언트 단에서 API 키가 노출되지 않도록 환경변수 및 서버사이드 호출 구조 검증
- [x] **Design Theme**: AI 채팅 버블 및 컨테이너에 `rounded-md`, `font-body` (Nunito) 적용

## 🧑‍💻 Part 2: 벡터 적재 및 펑션 콜링(Function Calling)

**목표:** RAG(Retrieval-Augmented Generation) 파이프라인 구축 및 타 파드 API 호출 자동화

- [x] **DB/Schema**: `packages/db/schema.db`의 `knowledge_vectors` 테이블 스키마 확인 (pgvector 사용)
- [x] **Data Pipeline**: `text-embedding-3-small` (1536 dim) 모델을 사용하여 문서를 벡터화하고 DB에 적재하는 로직 구현
- [x] **Backend (API)**: 사용자의 질문을 바탕으로 유사도가 높은 문서를 검색해오는 RAG 검색 API 구현
- [ ] **Integration (Pod B)**: AI가 '일정' 관련 의도를 파악했을 때, Function Calling을 통해 Pod B의 일정 등록 API를 호출하는 로직 작성
- [ ] **Collaboration**: Pod B 담당자와 Function Calling에 필요한 정확한 JSON 페이로드 규격 협의 및 확정
