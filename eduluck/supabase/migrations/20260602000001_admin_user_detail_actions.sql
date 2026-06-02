-- admin_audit_log action 확장 — 사용자 사주 상세 조회·삭제.
-- view_user: 어드민이 특정 사용자가 본 사주(세션) 목록 조회
-- delete_session: 어드민이 사용자의 사주(세션) 삭제 (subjects·interpretations cascade)

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in (
    'login', 'list_subjects', 'search_subjects', 'view_subject',
    'mask_off', 'add_admin', 'update_admin_role', 'remove_admin',
    'view_audit_log', 'list_users', 'grant_redo', 'revoke_redo',
    'view_user', 'delete_session'
  ));
