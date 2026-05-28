-- subjects.manse_json 에 gender 키 백필 — ManseResult.gender 영구 추가 (engine.ts) 와 짝.
--
-- 배경: 2026-05-28 이전 진단된 169 subjects row 의 manse_json 에 gender 키 ✗.
--   ManseResult 타입에 gender 가 영구 추가됐지만 옛 row 는 hydrate 시 'male' fallback.
--   현재 prod 영향은 ✗ (모든 row 에 shensha 가 이미 박혀있어 재계산 fallback trigger ✗) 이지만,
--   향후 hydrate 가 새 gender-의존 필드 재계산하도록 바뀔 때 옛 row 회귀 방지 차원.
--
-- 안전성:
--   - subjects.gender 는 NOT NULL CHECK ('male'|'female') — source-of-truth
--   - jsonb_set atomic, 단일 키만 inject (다른 필드 영향 ✗)
--   - idempotent — `NOT (manse_json ? 'gender')` 가 이미 박힌 row 자동 제외 (재실행 안전)
--   - 롤백: UPDATE public.subjects SET manse_json = manse_json - 'gender'

UPDATE public.subjects
SET manse_json = jsonb_set(manse_json, '{gender}', to_jsonb(gender))
WHERE NOT (manse_json ? 'gender');
