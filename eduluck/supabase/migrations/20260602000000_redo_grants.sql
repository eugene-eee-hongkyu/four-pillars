-- redo_grants — 어드민이 특정 카카오 로그인 사용자에게 "정밀 진단 다시 하기" 권한 부여.
-- 행이 존재하면 grant 됨 (presence = enabled). 해제는 행 삭제.
-- 첫 화면 "이전에 본 진단" 카드의 "다시 진단" 버튼 노출 조건 (만세력부터 재실행).
--
-- RLS: service_role only (admin API + /api/me/redo 모두 service_role 경유).

create table public.redo_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,                              -- 보조 식별용 (auth.users 조회 없이 admin UI 표시)
  granted_by text not null,                -- grant 한 admin 이메일
  granted_at timestamptz not null default now()
);

create index redo_grants_granted_at_idx on public.redo_grants(granted_at desc);

alter table public.redo_grants enable row level security;
-- 정책 없음 = 모든 anon/authenticated 차단. service_role만 통과.

-- ─── admin_audit_log action 확장 ───
-- 신규 action: list_users(카카오 사용자 목록 조회) · grant_redo · revoke_redo
alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in (
    'login', 'list_subjects', 'search_subjects', 'view_subject',
    'mask_off', 'add_admin', 'update_admin_role', 'remove_admin',
    'view_audit_log', 'list_users', 'grant_redo', 'revoke_redo'
  ));
