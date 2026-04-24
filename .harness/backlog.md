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


NONE

> 세션 요약에 "나중에", "백로그", "일단 스킵", "다음에", "우선순위 낮음" 등의 표현으로 명시적으로 미뤄진 항목은 없습니다.
>
> 참고: "다음으로 넘긴 것"으로 언급된 Supabase credentials 입력 → DB 마이그레이션 → Vercel 배포는 **다음 단계 작업(순차적 진행)**으로 기술되어 있으며, 우선순위를 낮추거나 의도적으로 보류한 백로그 항목과는 성격이 다릅니다. 해당 항목이 백로그로 분류되어야 한다면 별도로 알려주세요.