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

NONE

(세션 요약에서 "나중에", "백로그", "일단 스킵", "다음에", "우선순위 낮음" 등으로 **명시적으로 미뤄진** 항목을 찾았으나, 아래 두 항목은 "제안된 우선순위"와 "미결 질문"으로 언급되었습니다. 백로그 형식으로 기록할 만한 내용이 있어 재검토합니다.)

---

## 2026-04-24: 합충형파해 + 지장간 계산 모듈 추가

- **백로그 이유**: 프롬프트 수정(즉시 가능)을 먼저 하기로 방향이 기울었고, 합충형파해 구현 vs 프롬프트 수정 중 어느 것을 먼저 할지 결정이 나지 않은 채 세션 종료
- **할 것**: 합충형파해(천간합·지지합·충·형·파·해) 계산 로직 모듈 작성, 지장간 추출 로직 추가, 계산 결과를 프롬프트에 주입
- **필요한 것**: 프롬프트 수정(신살 축소·용신-대운 우선순위화) 먼저 완료 후 착수 권장 / 합충형파해 규칙 테이블 정의 필요
- **이전 검토**: 현재 신살(10% 가치)에 40% 공을 들이고 합충형파해(20% 가치)는 미구현 상태임을 3개 AI 모두 지적. 원국→격국/용신→대운/세운→합충형파해→신살 5층 계층 구조에 합의

---

## 2026-04-24: 과거 사건 검증 엔진

- **백로그 이유**: 과거 사건 입력 UI가 없어 지금 당장 구현 불가. 3개 AI