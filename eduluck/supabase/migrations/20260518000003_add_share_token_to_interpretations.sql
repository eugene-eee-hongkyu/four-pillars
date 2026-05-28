-- interpretations.share_token — 공유 URL 인증 토큰 (UUID).
--
-- 배경: 옛 share-URL 기능 도입 시 ad-hoc 으로 prod 에 추가됐던 컬럼이 repo migration 에 누락.
-- 2026-05-28 보안 audit ISSUE-8 fix — repo 박제.
--
-- 동작:
--   - default gen_random_uuid() — row insert 시 자동 생성 (UUID v4, 추측 불가)
--   - NOT NULL — share 가능 row 모두 token 보장
--   - UNIQUE — token 으로 row 식별 (share.ts 의 .eq('share_token', token))
--
-- 보안: token 자체가 인증 — 알면 read-only 접근. RLS bypass 한 service_role 만 통해 share.ts API 가
-- 본문 응답. token leak ✗ 한 경우 외부 접근 불가.

alter table public.interpretations
  add column if not exists share_token uuid not null default gen_random_uuid();

create unique index if not exists interpretations_share_token_idx
  on public.interpretations(share_token);
