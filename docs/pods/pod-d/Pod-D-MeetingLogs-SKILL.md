# Pod D: Meeting Logs System Skill (Full-stack Vertical Slicing)
<!-- Pod D: 회의록 및 음성 처리 스킬 (풀스택 수직적 분할 버전) -->

## 🎯 Domain Scope & Tech Stack
<!-- 🎯 도메인 범위 및 기술 스택 -->
- **Primary Path**: `apps/web/src/features/pod-d/` (Core logic & UI)
<!-- - **핵심 경로**: `apps/web/src/features/pod-d/` (핵심 로직 및 UI) -->
- **Framework**: Next.js (App Router) / **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Storage, Edge Functions)
- **Data Model**: `meeting_logs` table in `packages/db/schema.db`
- **Specialized Libs**: `wavesurfer.js`, `react-media-recorder` (for audio capture)

## 🤝 Full-stack Pairing Workflow (2-Person)
<!-- 🤝 2인 풀스택 협업 워크플로우 -->
- **Vertical Slicing**: Divide domain into small full-stack features.
<!-- - **수직적 분할**: 도메인을 작은 단위의 풀스택 기능으로 쪼갬. -->
  - **Member 1**: Audio Recording & Storage (Recorder UI + Storage Upload + DB Insert)
  <!-- - **팀원 1**: 오디오 녹음 및 스토리지 (녹음 UI + 스토리지 업로드 + DB 저장) -->
  - **Member 2**: STT Processing & Waveform (STT API/Edge Function + Waveform UI + Detail View)
  <!-- - **팀원 2**: STT 처리 및 파형 시각화 (STT API/에지 함수 + 파형 UI + 상세 뷰) -->
- **Collaboration**: Coordinate the timing of STT processing completion and its ingestion into Pod C's vector database.
<!-- - **협업**: STT 처리 완료 시점과 파드 C의 벡터 DB 적재 타이밍을 동기화할 것. -->

## 🛠 Data Integrity & Security
<!-- 🛠 데이터 무결성 및 보안 -->
- **Audio Privacy**: Ensure audio files in Supabase Storage are only accessible via signed URLs with appropriate permission checks.
<!-- - **오디오 개인정보**: Supabase 스토리지의 오디오 파일은 권한 확인을 거친 Signed URL을 통해서만 접근 가능하도록 설계. -->
- **STT Accuracy**: Handle potential Whisper API timeouts or errors gracefully on both backend and UI.
<!-- - **STT 정확도**: Whisper API의 타임아웃이나 에러 발생 시 백엔드와 UI 모두에서 적절히 예외 처리. -->

## 📜 Source of Truth & AI Protocol
<!-- 📜 데이터 표준 및 AI 코딩 규약 -->
- **Mandatory Schema Reference**: Always refer to `packages/db/schema.db` before any data-related coding to ensure field name and type consistency.
<!-- - **스키마 참조 필수**: 필드명 및 타입 일관성을 위해 모든 데이터 관련 코딩 전 반드시 `packages/db/schema.db`를 참조할 것. -->
- **AI Vibe Coding Guidance**: When using AI (Cursor, Gemini, etc.), explicitly provide the `schema.db` context to prevent hallucination of database structures.
<!-- - **AI 바이브 코딩 가이드**: AI를 활용할 경우, 데이터베이스 구조에 대한 환각(Hallucination)을 방지하기 위해 반드시 `schema.db` 컨텍스트를 제공할 것. -->

## 📦 Library Management Protocol
<!-- 📦 라이브러리 관리 규약 -->
- **Update Required**: Whenever a new library is installed, the agent MUST update `docs/operations/DEPENDENCIES.md` immediately with the library name, version, and specific purpose for Pod D.
<!-- - **업데이트 필수**: 새로운 라이브러리 설치 시, 에이전트는 반드시 즉시 `docs/operations/DEPENDENCIES.md`를 업데이트해야 하며, 라이브러리명, 버전 및 파드 D에서의 구체적인 용도를 기록할 것. -->

## 🔌 Interfaces (External Integration)
<!-- 🔌 인터페이스 (외부 연동 규격) -->
- **Event Forwarding**: Push the transcribed text and `source_id` to Pod C for automatic knowledge indexing.
<!-- - **이벤트 전달**: 변환된 텍스트와 원본 ID를 파드 C로 전달하여 자동 지식 인덱싱 처리. -->

## 🎨 Design Theme Adherence (Soft & Trustworthy)
<!-- 🎨 디자인 테마 준수 (부드러움 및 신뢰감) -->
- **Visual Style**: Use pastel tones, organic shapes, and generous border radii (`rounded-md` for cards, `rounded-pill` for buttons).
<!-- - **시각적 스타일**: 파스텔 톤, 유기적인 형태, 넉넉한 테두리 반경(카드 `rounded-md`, 버튼 `rounded-pill`)을 사용할 것. -->
- **Shadows**: Prefer soft, primary-tinted shadows (`shadow-soft`) over borders to separate space.
<!-- - **그림자**: 공간 구분을 위해 테두리 대신 부드럽고 푸른 틴트가 들어간 그림자(`shadow-soft`)를 우선 사용할 것. -->
- **Typography**: Apply `font-headings` (Fredoka) for titles and `font-body` (Nunito) for readability.
<!-- - **타이포그래피**: 제목에는 `font-headings`(Fredoka)를, 가독성이 필요한 본문에는 `font-body`(Nunito)를 적용할 것. -->

## 📋 Definition of Done
<!-- 📋 완료 조건 -->
- Is the audio waveform correctly visualized using the recorded Blob?
<!-- - 녹음된 Blob을 사용하여 오디오 파형이 정확히 시각화되는가? -->
- Does the full STT process (Upload -> API -> DB Update -> UI View) complete successfully?
<!-- - 전체 STT 프로세스(업로드 -> API -> DB 업데이트 -> UI 뷰)가 성공적으로 완료되는가? -->
