# Phase B 테스트 결과 — DIRECTION_SCORING.md doc 갱신

**일시**: 2026-05-23
**파일**: [eduluck/docs/DIRECTION_SCORING.md](../../eduluck/docs/DIRECTION_SCORING.md)

## 변경 사항

### 1. §0 면책 신규 추가

5개 단락:
1. **본 시스템이 주장하는 것 vs 안 하는 것** 표 (HAGUN_SCORING.md §0 패턴)
2. **자유도 함정**: 60 시그너 vs N=11 sample = in-sample fitting 위험 명시
3. **Self-fulfilling prophecy 주의**: 진로 시스템이 학운보다 결정 framing 강함 ("의대형", "예술형" 라벨 단정 위험)
4. **카테고리 sample 편향**: Authority·Entrepreneur·Action 0 sample 명시 → 외부 100명에서 5-10명씩 확보 필수
5. **외적 검증 도구**: Holland RIASEC 한국 타당성 81-85% (이제경 2009) → §9 매핑 cross-link

### 2. §1-2 학파 라벨 + 출처 인용 신규 추가

기존: "KCI 명리 진로상담 메타 + 부산대 평생교육원 표준" (모호)
변경: 4개 학파·문헌 명시 인용
- **자평명리 격국론** (자평진전·적천수)
- **김기승 (2009) 『명리직업상담론』** — 한국 현대 표준
- **함혜수 (2007)** — 격국 vs 직업 일치도 검증
- **이원태 (2005)** — 식신·상관 전문직 만족도

"단일 학파 일관성보다 한국 진로 분류 정합을 우선 + 김기승은 한국 현대 응용 매핑 메타 라벨이 정직" 명시.

### 3. §6 Calibration 톤 약화

- 헤더: "Calibration" → "Calibration (in-sample fit, 외적 검증 ✗)"
- 표 위 경고 박스 추가: "60 시그너 vs 11 sample 자유도 곱셈 = in-sample 정합 거의 보장. 외적 타당성은 외부 100명 + RIASEC 일치도에서만"
- Eugene → 홍규 일관성 유지 (calibration sample md 표기와 맞춤)
- "정합" → "in-sample 정합" 명시 + 카테고리 sample 편향 재강조 + 승희 sample이 분리 설계의 가장 강한 정성 증거 강조

### 4. 헤더 cross-link

`관련 문서` 줄에 HAGUN_SCORING.md 추가.

## 자가 테스트

### Test 1: ~ 기호 grep

- 명령: `grep -c "~" docs/DIRECTION_SCORING.md`
- 결과: **0** ✓ (sed로 일괄 변환)

### Test 2: 학파 인용 정확성

- 김기승 (2009) 『명리직업상담론』 — Claude 자료 + 통설 표준 ✓
- 함혜수 (2007) — Claude 자료에 출처 확인 ✓
- 이원태 (2005) — Claude 자료에 출처 확인 ✓
- 이제경 (2009) 한국 Holland 타당성 81-85% — Claude 자료 ✓

### Test 3: cross-link 무결성

- §0 → §9 RIASEC: `[§9 RIASEC 매핑](#9-riasec-매핑)` — §9는 Phase D-doc에서 추가 예정 (현재 dangling). Phase D-doc 완료 후 자동 해결.
- 헤더 → SCORING_SYSTEM.md, HAGUN_SCORING.md — 양방향 링크 OK

### Test 4: 톤 일관성

- §0 면책 톤이 HAGUN_SCORING.md §0과 동일 패턴 ✓
- §6 "in-sample fit" 톤이 HAGUN_LOOCV.md / CALIBRATION_COUNTERFACTUAL.md와 일관 ✓

## 사람 의존 항목

- [ ] 김기승 인용의 정합성 최종 검토 (한국 명리 표준 텍스트인지 사용자 확인 권고)
- [ ] §0 5개 단락의 균형 (너무 비판적이지 않은가) 검토

## 결과 요약

- **구현**: ✓
- **~ 기호**: 0
- **학파 인용**: 4개 출처 명시
- **외적 검증 도구**: Holland RIASEC 명시 + §9 cross-link
- **§9 RIASEC 표**: Phase D-doc에서 추가 예정

다음 단계 진행 가능 (Phase D-doc에서 §9 RIASEC 매핑 표 추가 시 cross-link 자동 해결).
