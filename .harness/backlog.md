# backlog.md — 나중에 할 것들

---

## 대기 중

## 2026-04-24: Supabase 연동 및 DB 스키마 migration

- **백로그 이유**: 선행 작업 필요 — Supabase 프로젝트 생성 및 credentials 확보 (사용자 직접 수행)
- **할 것**:
  1. Supabase 프로젝트 생성 (region: Tokyo 또는 Seoul)
  2. `.env.local`에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 입력
  3. `supabase/migrations/001_initial.sql` 작성 (sessions, conversations, qna_turns 테이블 + RLS)
  4. `supabase db push` 또는 Supabase 대시보드에서 직접 SQL 실행
  5. /api/session 라우트 동작 확인
- **필요한 것**: Supabase 계정, 프로젝트 생성 권한, 세 개의 환경 변수 값
- **이전 검토**: lib/supabase/client.ts·server.ts 작성 완료. /api/session route.ts 완성됨. SQL 스키마는 §4에 설계됨.
- **관련 파일**: sajutalk/lib/supabase/client.ts, server.ts, sajutalk/app/api/session/route.ts, docs/04_B_빌드지침서_사주톡.md §4

---

## 완료 / 취소
