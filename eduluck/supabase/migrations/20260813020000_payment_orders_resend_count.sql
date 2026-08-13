-- 어뷰징 방지: 발송 성공 후 사용자 재발송 횟수 제한(요약·상세 각 3회).
-- 최초 이행(fulfilled=false → 최초 발송)은 카운트하지 않음. 이미 성공한 뒤 '다시 받기'만 카운트.
-- 어드민 재발송은 무제한(운영자 override) — 이 컬럼은 사용자(/api/reports) 경로에서만 강제.

alter table public.payment_orders
  add column if not exists summary_resend_count integer not null default 0,
  add column if not exists detail_resend_count integer not null default 0;
