-- v4 legacy `interpret-premium` (16섹션 단일 호출) 단절.
-- 2026-05-27 결정: 옛 결제 고객 = 모두 테스트 → DB 보존 불필요.
--
-- 1) 옛 v4 데이터 삭제 (kind='premium').
-- 2) interpretations.kind CHECK constraint 제거 — v5 (premium-part1/part2/deep-N) kind 가
--    이미 prod 에서 사용 중이라 옛 CHECK 와 불일치. backlog 의 "kind 정책 결정"은 free text 유지로 확정.

delete from public.interpretations where kind = 'premium';

alter table public.interpretations drop constraint if exists interpretations_kind_check;
