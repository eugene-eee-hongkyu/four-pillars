-- 1) 어드민 '다운로드 만료 연장' 감사 로그 액션 추가
-- 2) 사용자 재발송 연타 방지용 last_resend_at (횟수 제한은 폐지 — 링크 재발송이라 비용 0.
--    다만 메일 발송 한도(Resend 일일 쿼터) 보호를 위해 주문당 60초 간격만 둔다. 어드민은 예외)
--    summary_resend_count / detail_resend_count 컬럼은 더 이상 사용하지 않음(무해하여 유지).

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check
  check (action in (
    'login', 'list_subjects', 'search_subjects', 'view_subject', 'mask_off',
    'add_admin', 'update_admin_role', 'remove_admin', 'view_audit_log',
    'list_users', 'grant_redo', 'revoke_redo', 'view_user', 'delete_session',
    'update_config', 'extend_download_expiry'
  ));

alter table public.payment_orders
  add column if not exists last_resend_at timestamptz;
