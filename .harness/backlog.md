# backlog.md — 나중에 할 것들

---

## 대기 중

## 2026-04-25: daily 톤 회귀 테스트

- **백로그 이유**: premium 톤 교체 작업 후 daily 톤에 사이드 이펙트 없는지 미확인 상태로 세션 종료
- **할 것**: daily 톤 전체 흐름 회귀 테스트 실행, 깨진 케이스 있으면 수정
- **필요한 것**: 기존 daily 톤 테스트 케이스 또는 체크리스트, 로컬 서버
- **이전 검토**: reality → premium 교체가 주요 변경, daily는 별도 톤이므로 영향 범위 불명확한 상태

---

## 2026-04-25: Phase 3 Supabase DB 마이그레이션

- **백로그 이유**: 현재 Phase 우선순위 외, 선행 작업(Supabase credentials 확보) 미완료
- **할 것**: Phase 3 마이그레이션 스크립트 작성 및 Supabase 스키마 적용
- **필요한 것**: Supabase 프로젝트 접근 권한 및 credentials(.env.local 3개 변수), 마이그레이션 대상 테이블 정의
- **이전 검토**: lib/supabase/client.ts·server.ts 작성 완료. /api/session route.ts 완성됨. SQL 스키마는 §4에 설계됨.
- **관련 파일**: sajutalk/lib/supabase/client.ts, server.ts, sajutalk/app/api/session/route.ts

---

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

~~localhost:3002 E2E 확인~~ → 2026-04-28 세션에서 Chrome DevTools MCP 스크린샷으로 chat/result 화면 시각 검증 완료

~~합충형파해 + 지장간 계산 모듈 추가~~ → docs/runs/2026-04-24-manse-v2-hapchunh-sciencetone_run.md
- 완료일: 2026-04-24 (커밋 abdb548)


NONE

> 세션 요약에서 "나중에", "백로그", "일단 스킵", "다음에", "우선순위 낮음" 등의 표현이 명시적으로 사용된 항목은 없습니다.
>
> 단, "**다음으로 넘긴 것**" 항목이 있어 판단 근거를 밝힙니다:
> - 해당 항목(Phase 3 Supabase 자격증명 입력 → DB 마이그레이션 → Vercel 배포 승인)은 **세션 종료 시 자연스러운 다음 단계**로 기술되어 있으며, 우선순위를 낮추거나 의도적으로 미룬 것이 아닌 **순차 진행 예정 작업**으로 읽힙니다.
> - 백로그 형식은 "지금 할 수 있었으나 의식적으로 미룬 항목"에 적합하므로, 이 경우는 해당하지 않는다고 판단했습니다.
>
> 만약 이 항목도 백로그로 기록하길 원하시면 말씀해 주세요.

~~[2] 2026-04-29: CLI 프롬프트 테스트 스크립트 작성~~ → 2026-04-29 20:11 세션에 `prompt_checker/` 디렉토리로 완성 (커밋 8593a65). fixtures × prompts 매트릭스 러너 + diff2html 좌우 분할 웹뷰어 + keeper 시스템.