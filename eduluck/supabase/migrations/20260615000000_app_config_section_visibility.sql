-- app_config — 전역 런타임 설정 key-value (admin 설정 화면에서 변경).
-- deep_section_access: "더 자세히 보기"(deep-dive) 무료 공개 정책 (jsonb).
--   { mode: 'per_section' | 'count', freeSections: int[], freeCount: int }
--   - per_section: freeSections 에 든 번호만 무료
--   - count: 앞에서부터 freeCount 개(1..N) 무료, 나머지 유료
--   초기값 = count 모드, freeCount 14 → 1~14 전체 무료.
--   config 미존재/오류 시 코드에서 전체 무료(fail-open).
--
-- RLS: service_role only (admin API + 공개 read API 모두 service_role 경유).

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.app_config enable row level security;
-- 정책 없음 = anon/authenticated 차단. service_role만 통과.

insert into public.app_config (key, value, updated_by)
values (
  'deep_section_access',
  '{"mode":"count","freeSections":[1,2,3,4,5,6,7,8,9,10,11,12,13,14],"freeCount":14}'::jsonb,
  'migration:init'
)
on conflict (key) do nothing;

-- ─── admin_audit_log action 확장 ───
-- update_config: 어드민이 전역 설정(app_config) 변경 (deep-dive 무료 정책 등)
alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in (
    'login', 'list_subjects', 'search_subjects', 'view_subject',
    'mask_off', 'add_admin', 'update_admin_role', 'remove_admin',
    'view_audit_log', 'list_users', 'grant_redo', 'revoke_redo',
    'view_user', 'delete_session', 'update_config'
  ));
