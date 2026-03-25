 🌐 WorkPresso 통합 API 명세서 (Draft)

  Base URL: http://localhost:3000  
  Auth: Supabase Auth (Bearer Token) 사용 권장

  ---

  📄 Pod A: 결재 문서 (Documents)

  [GET] /api/documents
   * 설명: 사용자가 작성했거나 결재해야 할 문서 목록을 조회합니다.
   * 쿼리 파라미터: status (DRAFT, PENDING, APPROVED, REJECTED)

  [POST] /api/documents
   * 설명: 새로운 결재 문서를 생성합니다.
   * Body: { "title": "string", "content": "text" }

  [PATCH] /api/documents/[id]/status
   * 설명: 문서의 결재 상태를 변경합니다 (승인/반려).
   * Body: { "status": "APPROVED" | "REJECTED" }

  ---

  📅 Pod B: 업무 일정 (Schedules)

  [GET] /api/schedules
   * 설명: 특정 기간 내의 일정 목록을 조회합니다.
   * 쿼리 파라미터: start, end (ISO 8601)

  [POST] /api/schedules
   * 설명: 새로운 일정을 등록합니다. (AI 에이전트의 Function Calling이 호출하는 핵심 API)
   * Body: 

   1     {
   2       "title": "주간 회의",
   3       "start_time": "2024-03-25T14:00:00Z",
   4       "end_time": "2024-03-25T15:00:00Z"
   5     }

  [DELETE] /api/schedules/[id]
   * 설명: 특정 일정을 삭제합니다.

  ---

  🤖 Pod C: AI 및 지식 (AI & Knowledge)

  [POST] /api/chat
   * 설명: AI 비서와 대화합니다 (RAG 및 일정 등록 도구 포함).
   * Body: { "messages": [...] }
   * 응답: 실시간 스트리밍 텍스트

  [POST] /api/admin/sync-knowledge
   * 설명: 로컬 지식 문서를 벡터 DB와 동기화합니다.

  ---

  🎙️ Pod D: 회의록 및 음성 (Meeting Logs)

  [POST] /api/meetings/upload
   * 설명: 회의 음성 파일(.mp3, .wav)을 업로드합니다.
   * Body: FormData (file)
   * 응답: { "id": "uuid", "audio_url": "url" }

  [GET] /api/meetings/[id]
   * 설명: 특정 회의의 상세 내용 및 STT(텍스트 변환) 결과를 조회합니다.
   * 응답:

   1     {
   2       "id": "uuid",
   3       "stt_text": "오늘 회의 주제는...",
   4       "created_at": "timestamp"
   5     }

  [POST] /api/meetings/[id]/summary
   * 설명: AI를 사용하여 회의 내용을 요약합니다 (Pod C와 연동).

  ---

  👤 공통: 사용자 및 설정 (Common)

  [GET] /api/users/me
   * 설명: 현재 로그인한 사용자의 정보를 조회합니다.

  [PATCH] /api/users/status
   * 설명: 사용자의 상태를 변경합니다 (ACTIVE, VACATION, MEETING, OFFLINE).

  ---

  💡 통합 개발 가이드

   1. 데이터 일관성: 모든 API는 응답 시 packages/db/schema.db에 정의된 필드명을 엄격히 준수해야 합니다.
   2. 에러 처리: 에러 발생 시 { "error": "메시지" } 형태의 일관된 JSON 응답을 반환합니다.
   3. 에이전트 연동: Pod B, Pod D의 데이터가 생성될 때 Pod C의 벡터 DB에 자동으로 적재되도록 설계하는 것이 핵심입니다.