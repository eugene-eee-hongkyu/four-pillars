-- sessions.device_id 추가 — Mixpanel deviceId (localStorage 영구 UUID) 와 매핑.
-- /api/feedback 가 deviceId 검증으로 가짜 응답 주입 차단 (mom test 분석 신뢰도).
--
-- + feedback_responses (session_id, source) UNIQUE — 같은 진단(sessionId) 의 같은 출처(source) 에서
--   중복 제출 차단. 클라이언트 `feedbackSubmittedSessions` dedup 의 server-side 백업.
--
-- 호환성: 기존 sessions row 는 device_id = NULL. /api/feedback 가 session.device_id 가 NULL 이면 검증 skip
--   (mom test 진행 중 기존 사용자 영향 ✗). 신규 session 부터 device_id 강제.

-- 1. sessions.device_id 컬럼 추가 (nullable for backward compat)
alter table public.sessions add column if not exists device_id text;
create index if not exists sessions_device_id_idx on public.sessions(device_id);

-- 2. feedback_responses (session_id, source) UNIQUE
--    같은 진단(sessionId) 의 같은 위치(premium-part2 / deep-dive) 에서 중복 제출 차단.
--    다른 source 는 OK (premium 끝 1회 + deep-dive 끝 1회 = 합 2회 허용).
create unique index if not exists feedback_responses_session_source_uniq
  on public.feedback_responses(session_id, source);
