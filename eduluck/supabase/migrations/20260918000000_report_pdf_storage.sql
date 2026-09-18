-- 정밀 학운 PDF 리포트 — 이메일 첨부 → 저장소 보관 + 1년 다운로드 링크.
--
-- 보관소: Supabase Storage 비공개 버킷 report-pdfs (service_role 만 접근, 정책 없음 = anon 차단).
-- 경로: orders/<orderId>/summary.pdf · orders/<orderId>/detail.pdf
--
-- 이용기간: download_expires_at = 결제일 + 1년 (약관 제6조). 어드민이 연장 가능.
-- 보관: 만료 후 1년 더 보관(총 2년) 뒤 크론이 파일 삭제 → *_pdf_path null.
-- first_downloaded_at: 최초 다운로드 시각 — 환불정책 "다운로드 시점부터 청약철회 제한" 근거.

insert into storage.buckets (id, name, public)
values ('report-pdfs', 'report-pdfs', false)
on conflict (id) do nothing;

alter table public.payment_orders
  add column if not exists summary_pdf_path text,
  add column if not exists detail_pdf_path text,
  add column if not exists download_token text,
  add column if not exists download_expires_at timestamptz,
  add column if not exists first_downloaded_at timestamptz;

create unique index if not exists payment_orders_download_token_idx
  on public.payment_orders (download_token)
  where download_token is not null;

-- 만료+1년 지난 파일 정리(크론)용
create index if not exists payment_orders_download_expires_idx
  on public.payment_orders (download_expires_at)
  where download_expires_at is not null;
