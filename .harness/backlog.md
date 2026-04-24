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

## 2026-04-24: 과거 사건 검증 엔진

- **백로그 이유**: 과거 사건 입력 UI가 없어 지금 당장 구현 불가. 3개 AI 모두 장기 로드맵으로 분류.
- **할 것**: 과거 사건(날짜 + 내용) 입력 UI, 해당 시점 운세 역계산, AI 역검증 프롬프트 작성
- **필요한 것**: Supabase DB(대화 저장) 완료 후 착수 권장
- **이전 검토**: ChatGPT가 제안. 사용자 피드백 루프에 유용하나 MVP 범위 초과로 보류.

---

## 완료

~~합충형파해 + 지장간 계산 모듈 추가~~ → docs/runs/2026-04-24-manse-v2-hapchunh-sciencetone_run.md
- 완료일: 2026-04-24 (커밋 abdb548)
