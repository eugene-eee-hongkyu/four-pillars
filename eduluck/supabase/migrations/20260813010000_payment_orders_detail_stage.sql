-- 2단계 발송: 메일1(요약, 결제 즉시) → 메일2(상세 14섹션, 백그라운드 생성 후).
-- payment_orders.fulfilled = 메일1(요약) 발송 여부(기존 유지).
-- 아래 컬럼 = 메일2(상세) 단계 상태.

alter table public.payment_orders
  add column if not exists detail_fulfilled boolean not null default false,
  add column if not exists detail_error text,
  add column if not exists detail_started_at timestamptz;   -- 처리 중 잠금(중복 생성 방지)

-- 상세 미발송 주문 스윕용 인덱스(cron)
create index if not exists payment_orders_detail_pending_idx
  on public.payment_orders (created_at)
  where status = 'paid' and detail_fulfilled = false;
