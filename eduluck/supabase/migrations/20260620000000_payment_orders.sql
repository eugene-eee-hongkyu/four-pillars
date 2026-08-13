-- payment_orders — 토스페이먼츠 결제 주문 (정밀 학운 PDF 리포트).
-- 결제 전 pending 생성 → 성공 콜백에서 confirm(승인) → paid + PDF 이메일 발송(fulfilled).
-- 비회원 구매 가능(이메일만 수집). service_role only.

create table public.payment_orders (
  id text primary key,                          -- orderId (서버 생성, 토스 requestPayment.orderId)
  session_id uuid references public.sessions(id) on delete set null,
  child_subject_id uuid references public.subjects(id) on delete set null,
  email text not null,                          -- 리포트 발송지
  child_nickname text,
  amount integer not null,                      -- 결제 금액(원)
  order_name text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_key text,                             -- 토스 paymentKey (승인 후)
  fulfilled boolean not null default false,     -- PDF 이메일 발송 완료 여부
  fulfill_error text,                           -- 발송 실패 사유(있으면)
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payment_orders_created_at_idx on public.payment_orders(created_at desc);
create index payment_orders_session_id_idx on public.payment_orders(session_id);
create index payment_orders_status_idx on public.payment_orders(status);

alter table public.payment_orders enable row level security;
-- 정책 없음 = anon/authenticated 차단. service_role(결제 API)만 통과.
