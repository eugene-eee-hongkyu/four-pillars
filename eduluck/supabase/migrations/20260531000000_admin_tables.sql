-- admin_users — admin 권한 관리 (Google OAuth 로그인 후 권한 확인용)
-- admin_audit_log — PIPA §29 안전조치: admin 행동 기록 (login·list·search·view·mask_off·CRUD)
-- subjects 검색 인덱스 — 이름·생년월일·고향 검색 성능
--
-- 초기 super-admin 시드: SUPER_ADMIN_EMAIL env로 첫 Google 로그인 시 자동 INSERT
-- (lib/admin/auth.ts의 ensureSuperAdmin 함수가 처리)

-- ─── admin_users ───
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now(),
  created_by text,
  notes text
);

create index admin_users_email_idx on public.admin_users(email);

-- RLS: anon 차단 (모든 접근은 service_role only)
alter table public.admin_users enable row level security;

-- 정책 없음 = 모든 anon/authenticated 차단. service_role만 통과.

-- ─── admin_audit_log ───
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null check (action in (
    'login', 'list_subjects', 'search_subjects', 'view_subject',
    'mask_off', 'add_admin', 'update_admin_role', 'remove_admin',
    'view_audit_log'
  )),
  target_id uuid,              -- 조회한 subject_id, 추가/변경/삭제한 admin id 등
  query_params jsonb,          -- 검색어·페이지·필터 등
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index admin_audit_log_admin_email_idx on public.admin_audit_log(admin_email);
create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_action_idx on public.admin_audit_log(action);

alter table public.admin_audit_log enable row level security;
-- service_role only

-- ─── subjects 검색 인덱스 ───
-- 현재 165 rows, mom test 후 증가 대비. 이름·생년월일·고향 검색에 사용.
create index if not exists subjects_nickname_idx on public.subjects(nickname);
create index if not exists subjects_birth_idx on public.subjects(birth_year, birth_month, birth_day);
create index if not exists subjects_location_idx on public.subjects(birth_location);

-- 부분일치 검색 성능 (ILIKE) — trigram extension 활용
create extension if not exists pg_trgm;
create index if not exists subjects_nickname_trgm_idx on public.subjects using gin (nickname gin_trgm_ops);
create index if not exists subjects_location_trgm_idx on public.subjects using gin (birth_location gin_trgm_ops);
