-- admin id/pw 로그인 — 유저 OAuth(카카오/구글)에서 완전 분리.
-- 기존: Supabase auth user + admin_users.email 매칭 → 이제 username/password 자체 인증.
-- 세션: admin_sessions 에 임의 토큰의 sha256 해시 저장(만료 30일). service_role only.

-- ─── admin_users: 로그인 자격 컬럼 추가 ───
alter table public.admin_users
  add column if not exists username text unique,
  add column if not exists password_hash text;

-- ─── admin_sessions: 로그인 세션 토큰 ───
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,        -- sha256(raw token) hex. raw token 은 저장하지 않음.
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  ip_address text,
  user_agent text
);

create index if not exists admin_sessions_token_hash_idx on public.admin_sessions(token_hash);
create index if not exists admin_sessions_admin_id_idx on public.admin_sessions(admin_id);
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions(expires_at);

alter table public.admin_sessions enable row level security;
-- 정책 없음 = 모든 anon/authenticated 차단. service_role만 통과.
