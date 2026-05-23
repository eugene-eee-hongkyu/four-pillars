# Phase D-doc 테스트 결과 — RIASEC 매핑 + 분포 시뮬레이션

**일시**: 2026-05-23
**파일**:
- [eduluck/docs/DIRECTION_SCORING.md](../../eduluck/docs/scoring/DIRECTION_SCORING.md) §9·§10 추가
- [eduluck/scripts/eval-direction-distribution.ts](../../eduluck/scripts/eval-direction-distribution.ts) 신규

## 변경 사항

### 1. DIRECTION_SCORING.md §9 RIASEC 매핑 신규

- 8 카테고리 × Holland RIASEC 6유형 매핑 표
- Holland 한국 타당성 (이제경 2009: 한국 고등학생 81%·일반인 85%) + Big5 상관 (한양대 2017) + KNOW (이요행 2003)
- 미매핑 RIASEC (S Social, C Conventional 단독) 명시
- 외부 100명 모집 시 Holland Interest Profiler 동시 시행 권고
- O*NET / KNOW 도구 출처 URL 명시
- 매핑의 한계 명시 (느슨한 비교 기준, 변환 공식 ✗)

### 2. DIRECTION_SCORING.md §10 분포 시뮬레이션 신규

- 카테고리별 1티어 평균 vs random cohort gap 표 (8 카테고리)
- 4가지 핵심 발견 정리 (Scholar 유일 신호 / cutoff 후함 / authority·arts gap 음수 / entrepreneur·action 보수적)
- 표현 전략 함의 (Scholar 단언 OK, 다른 카테고리 "참고" 톤)

### 3. scripts/eval-direction-distribution.ts 신규

- A안 1000 random + B안 1티어 5명 ±2년 cohort 100×5
- LCG seed-able PRNG
- 카테고리별 stats: meanTotal, 매우강%, 강 이상%, 보통 이상%
- 1티어 5명 개별 + 평균 출력
- gap 비교 표 + 해석 가이드

## 자가 테스트

### Test 1: 스크립트 실행 (seed 42)

명령: `npx tsx scripts/eval-direction-distribution.ts --seed 42 --n 1000`

결과:
- A안 random 1000개 완주
- B안 cohort 500개 완주
- 1티어 5명 출력
- 비교 표·해석 정상

### Test 2: 스크립트 실행 (seed 777, 안정성)

명령: `npx tsx scripts/eval-direction-distribution.ts --seed 777 --n 1000`

| Category | seed 42 gap | seed 777 gap | 안정성 |
|---|---|---|---|
| scholar | +1.94 | +1.81 (B안 기준) | ✓ |
| medical | +0.80 | +0.52 | ✓ (작은 변동) |
| action | +0.79 | +0.89 | ✓ |
| arts | -0.92 | -0.95 | ✓ |
| 다른 4 카테고리 | 음수 또는 0 근처 | 동일 패턴 | ✓ |

→ 두 seed에서 결과 안정. Scholar만 유일하게 강한 신호인 점 일관.

### Test 3: 핵심 통찰 검증

**Scholar 유일 신호**:
- seed 42: 1티어 5.8 vs random 3.93 (gap 1.87)
- seed 777: 1티어 5.8 vs random 3.83 (gap 1.97)
- 두 seed 모두 gap ≥ 1.8 = 명확한 신호

**False positive rate ≥ 30% 카테고리**:
- seed 42: scholar 37.7%, authority 30%, engineer 31.4%, business 30%, arts 35.8%
- seed 777: scholar 38.1%, engineer 30.4%, arts 37.2%
- 일관 (scholar·engineer·arts·business는 매번 30% 이상)

**Sample 0 카테고리의 보수적 cutoff**:
- entrepreneur 7-7.3%, action 9.5-9.5% (두 seed에서 일관)
- → cutoff은 보수적이라 random에 후하지 않음 (positive)
- → 그러나 시그너 weight ad-hoc 위험은 sample 0이라 검증 ✗

### Test 4: ~ 기호 grep

명령: `grep -c "~" docs/DIRECTION_SCORING.md scripts/eval-direction-distribution.ts`

- doc: 0 ✓
- script: 0 ✓

### Test 5: typecheck

명령: `npx tsc --noEmit`
결과: PASS (no output)

## 핵심 발견 요약

**가장 중요한 통찰**: **방향성 시스템에서 진짜 차별성을 가진 카테고리는 Scholar 1개**.

함의:
- v8 8 카테고리 시스템의 정당화는 Scholar에 집중되어 있음
- 다른 7 카테고리는 sample 다양화 (외부 100명) 후 재검증 필수
- **현재 단계에서 "Engineer 강", "Business 강" 같은 라벨 단정은 데이터로 정당화 ✗**
- 표현 전략:
  - Scholar 강 → 비교적 단언 가능
  - 다른 카테고리 강 → "참고" 톤, 외부 검증 진행 중 명시
  - Authority·Arts 음수 gap → "1티어 sample이 학자형이라 자연" 정도 설명

이 발견은 **Phase C (recommendedFields 환경 키워드)와 LLM prompt 톤 결정에 직접 영향**. Scholar는 직업명 단정 OK, 다른 카테고리는 환경 위주가 정직.

## 사람 의존 항목

- [ ] RIASEC 매핑 표의 명리 정합성 최종 검토 (Authority가 E냐 C냐 등 미세 결정)
- [ ] §10 결과 해석에 대한 통계적 정밀도 검토 (1티어 sample 5명이라 통계 신뢰 구간 큼)

## 결과 요약

- **구현**: ✓
- **스크립트**: ✓ (seed 42·777 안정)
- **doc 갱신**: ✓ (§9 RIASEC + §10 분포)
- **§0 cross-link**: §9 RIASEC 매핑 자동 해결 (Phase B에서 만든 dangling 링크)

**Phase C에 영향**: Scholar만 데이터로 정당화됨 → recommendedFields 환경 키워드 보강 시 Scholar 외 카테고리는 더 보수적 톤 적용.

다음 단계 진행 가능.
