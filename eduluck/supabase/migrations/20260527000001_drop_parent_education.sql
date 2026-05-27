-- 부모 학력 입력 폐지 — 2026-05-27.
-- Phase H 에서 학운 가중치 제거 후 UI·prompt 영향 없는 dead code 정리.
-- subjects.education_json column 제거 (4 row 데이터 같이 삭제).

alter table public.subjects drop column if exists education_json;
