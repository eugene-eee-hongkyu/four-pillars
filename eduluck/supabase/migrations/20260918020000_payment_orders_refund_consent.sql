-- 결제 전 '청약철회(환불) 제한 + 다운로드 이용기간 1년' 동의 시각 기록.
-- 전자상거래법 제17조 제2항 제5호·제6항: 디지털 콘텐츠 환불 제한은 사전에 명확히 고지·동의받아야 유효.
-- 화면 체크만으로는 증거가 남지 않아 주문 행에 동의 시각을 보관(분쟁 대응).
-- 서버(/api/payments/order)가 동의 없는 주문 생성을 거부한다.

alter table public.payment_orders
  add column if not exists refund_policy_agreed_at timestamptz;
