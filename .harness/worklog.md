# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-05-21.md](archive/worklog-2026-05-21.md)

---

## Session 2026-05-22 08:23 — 부모 사주 입력 옵션 재도입 + 시간 정확도 룰

### 작업 요약

**사용자 결정 (옵션 A)**: 부모 사주 입력을 옵션 토글로 재도입. 시간 모름 체크박스는 제거하고 "정확한 시간 아실 때만 입력" 안내 문구로 자연 처리.

**family-input.tsx 재작성 (180 → 287줄)**
- 어머니·아빠 옵션 토글 영역 복원 (b14dfeb 시점 코드 베이스)
- 부모 영역 안 "시간 모르겠어요" 체크박스 제거
- 부모 영역 상단에 안내 문구: "💡 출생 시간을 정확히 아실 때만 입력해주세요. 정확하지 않으면 비워두시는 게 더 정확한 진단으로 이어져요."
- 자녀 시간 정책은 그대로 (필수 + 모달 거부)
- motherSectionValid·fatherSectionValid에 `parsedTime !== null` 추가 (시간 모름은 valid ✗)

**4개 legacy routes 헤더 정리 (DEPRECATED → LEGACY)**
- `mother-saju.tsx`·`father-saju.tsx`·`mother-manse.tsx`·`parent-education.tsx`
- "DEPRECATED" 표현 → "LEGACY (직접 진입 ✗)"로 정리
- family-input 통합 입력으로 정상 동작, legacy 화면은 직접 진입만 ✗

**검증**
- typecheck ✓ / 회귀 11/11 통과 ✓
- A/B LLM 재검증 ✗ (직전 세션에서 어머니 ✓/✗ §14 emotional impact 855 vs 859 chars 동등 확인 완료)

### 다음 액션

1. UI prod 배포 후 어머니·아빠 토글 시각 검증 + 시간 정확도 안내 문구 표시 확인
2. Eugene mom test 10명 진입 — 어머니 입력률·§14 톤 정성 평가
3. mom test 결과로 어머니 입력률 < 30% → 다시 옵션 제거 / > 50% → 디폴트 보강 결정

---

## Session 2026-05-21 19:47 — /worklog 시각 정정 + worklog archive

### 작업 요약

- 직전 두 세션(부모 사주 입력 제거 + 의약 점수 모듈 도입) 기록 시각이 추측(21:00·19:30)이었음을 인지 → 실제 시각 19:47로 정정
- worklog.md가 516줄로 500 초과 → `archive/worklog-2026-05-21.md`로 이동 후 새 worklog 시작
- decision.md 헤더에 19:47 시각 추가

### 다음 액션

1. UI prod 배포 후 자녀 단일 입력 + §14 prod 풀이 시각 검증
2. Eugene mom test 10명 진입 — 자녀 단일 입력 + 시간 필수 + N=11 시스템 + 의약 모듈 + 새 §14
3. mom test 결과로 §14 emotional impact 정성 평가 + 어머니 사주 재도입 여부 결정
