# Pod D: Meeting Logs System (회의록 및 음성 처리 시스템) 작업 분배

본 문서는 풀스택 수직적 분할(Full-stack Vertical Slicing) 원칙에 따라 Pod D의 세부 구현 기능을 팀원들에게 분배하기 위한 태스크 리스트입니다.

## 🧑‍💻 Part 1: 오디오 녹음 및 스토리지

**목표:** 브라우저 내 오디오 녹음 처리 및 안전한 파일 업로드/저장 인프라 구축

- [ ] **Frontend (UI/Logic)**: 브라우저 마이크 접근 및 오디오 녹음 제어 로직 구현 (`react-media-recorder` 활용)
- [ ] **Frontend (UI)**: 녹음 시작, 일시정지, 중지 버튼 등 레코더 UI 구현 (`rounded-pill` 버튼 적용)
- [ ] **Backend (Storage)**: 녹음된 오디오 파일을 Supabase Storage에 업로드하는 로직 구현
- [ ] **Security**: 스토리지의 오디오 파일에 대한 권한 체크 및 Signed URL 발급 로직 구축
- [ ] **DB/Schema**: `packages/db/schema.db`의 `meeting_logs` 테이블에 업로드된 오디오 메타데이터(Insert) 저장

## 🧑‍💻 Part 2: STT 처리 및 파형 시각화

**목표:** 오디오 파일의 텍스트 변환 및 풍부한 시각적 피드백 제공

- [ ] **Frontend (UI)**: 녹음된 오디오 Blob 데이터를 활용해 오디오 파형(Waveform) 시각화 컴포넌트 구현 (`wavesurfer.js` 활용)
- [ ] **Backend (API)**: 오디오 파일을 STT API(Whisper 등)로 전송하여 텍스트로 변환하는 Edge Function 또는 서버 API 구현
- [ ] **Error Handling**: Whisper API 호출 시 발생할 수 있는 타임아웃/에러에 대한 백엔드 및 UI 예외 처리
- [ ] **Frontend (UI)**: 변환된 회의록 텍스트 상세 뷰(Detail View) 화면 구현
- [ ] **Integration (Pod C)**: STT 변환이 완료된 텍스트와 원본 `source_id`를 Pod C로 전달하여 자동 지식 벡터 인덱싱 이벤트를 발생시키는 로직 추가
