# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/worklog-2026-06-03.md](archive/worklog-2026-06-03.md)

---

## Session 2026-06-12 16:04 — 14섹션 통합 잔재 정리 + 스켈레톤 캐시 진단

### 작업 요약
- **로딩 스켈레톤이 옛 10섹션으로 보인다는 제보 진단** — 코드(`PART1/PART2_SECTION_HEADERS` 7개)·배포 모두 정상 확인. 프로덕션 번들(luck.z21labs.world)을 직접 curl → `v6.0-14sections-merge` + "부모-자녀 합"(부모 ×7) 포함 확정. 즉 **배포 완료 직전 로드된 브라우저 캐시** 문제 → 하드 새로고침으로 해결
- **진짜 잔재 정리** (`29f72a9`): BirthSummary 부모 사주 미입력 힌트 "§8 엄마-자녀 합·§9 아버지-자녀 합" → "§6 부모-자녀 합" (사용자 노출 문구). interpret-premium·StreamingBody 주석 1-10/11-20 → 1-7/8-14 (동작 무관, reveal은 minSectionNum 동적 산출)
- typecheck·웹 빌드 통과

### 다음 액션
- 배포 후 14섹션 LLM 출력 점검 (헤더 번호·병합 내용·§14 액션 카드)
- mom test 배포 + 인터뷰 4문항
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-12 15:49 — 정밀 진단 20 → 14 섹션 통합 (읽기 피로 감소, v6.0)

### 작업 요약
- **정밀 진단 20 → 14 섹션 통합** (`5b20e8d`) — "읽다 안 읽힌다" 피드백 반영. 섹션별 문장수는 유지(섹션 수가 줄어 전체 길이 자연 감소)
  - **Part 1 (10→7)**: §5 환경+건강 흡수 / §6 부모-자녀 합(엄마+아빠, 입력된 만큼) / §7 양육 가이드(훈육+양육경계)
  - **Part 2 (10→7)**: §8 친구·선생님(또래+학원, 두 단락) / §12 전공·진로(§18 직업 흐름 흡수) / §14 어머니 한마디(+효과적 액션 3카드). §18 직업·§19 액션 별도 섹션 제거
- **클라이언트 무영향 확인**: InterpretBody 본문 파서는 마커 문자열(시기카드·강점약점카드·TL;DR·시그니처) 기반 → 재번호 영향 0. StreamingBody는 헤더 배열 min/max 동적 산출
- **baseline §번호 디커플링**: shared.ts baseline 내부 §번호는 옛 번호 유지(텍스트로 매칭) + 두 프롬프트에 "출력 헤더는 새 번호(1-14)만" 명시 지시 추가 (옛 ## 16·## 20 헤더 출력 차단). pre-existing 오라벨(§14 한마디·§18 조심) 일괄 재번호 시 오염 위험 회피
- interpret-deep 섹션맵 1-20 → 1-14, interpret-premium 헤더배열·"14 섹션" 카운트, PREMIUM_PROMPT_VERSION v5.26 → v6.0-14sections-merge(캐시 무효화)
- 학운 점수·티어·방향성·peer/academy/abroad 점수 영향 0. typecheck·웹 빌드·유닛 57/57 PASS

### 다음 액션
- **배포 후 실제 LLM 출력 점검** — 테스트 사주로 Part1·Part2 전문 뽑아 ① 새 번호(1-14) 헤더 ② 병합 섹션이 두 내용 다 담는지 ③ §14 액션 카드 포함 확인
- mom test 배포 + 인터뷰 4문항
- 통신판매업 신고 + 포트원 PG 가맹점 심사

```markdown
## Session 2026-06-03 15:59 — 홈 카드 삭제 버튼 추가 + 워크로그 갱신

### 작업 요약
- 홈 화면 history 카드에 재진단 허용 사용자용 "삭제" 버튼 추가
- worklog.md, state.md 갱신 및 커밋 (`2bd1a86`)
- git push 완료

### 다음 액션
- mom test 친구 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 점검
- 통신판매업 신고 + 포트원 PG 심사
```

준비 완료. 이 항목을 어디에 기록할까요? (`docs/worklog.md` 또는 별도 위치)


## Session 2026-06-03 13:00 — 첫 화면 history 카드 "삭제" 버튼 (재진단 허용 사용자)

### 작업 요약
- **재진단 허용 사용자에게 홈 카드 "삭제" 추가** (`da482e9`) — 재진단 시 같은 자녀가 중복 카드로 남으므로 정리용. 카드 푸터를 "↻ 다시 정밀 진단 | 🗑 삭제" 분할(확인 모달)
- **DELETE `/api/sessions/[sessionId]`** — 본인 소유(user_id 일치, IDOR 차단) 세션 삭제 → subjects·interpretations·surveys·funnel_events cascade. GET과 동일 파일·소유권 패턴 재사용
- **removeSessionFromHistory** (flow context) — 서버 삭제 성공 후 로컬 sessionsHistory에서 제거 + 현재 로드 세션이면 sessionId 클리어. `DELETE_DIAGNOSIS_CLICK` 이벤트
- **프로덕션 e2e 검증** — 테스트 유저 + throwaway 세션 2개로: 401(무인증)·403(타인 소유 IDOR 비파괴)·200(본인)·404(재삭제)·400(비-uuid) + cascade(세션·subject·interpretation 0, 잔존 세션 1, hongary 무손상). 테스트 계정·데이터 정리
- typecheck·웹 빌드·유닛 57/57 PASS

### 다음 액션
- mom test 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 모순·품질 점검
- 통신판매업 신고 + 포트원 PG 가맹점 심사

## Session 2026-06-03 10:39 — 루트 worklog.md 커밋 + worklog 아카이브

### 작업 요약
- 루트 `worklog.md`(스테일 중복본, 13줄·2026-06-01) git add + commit + push (`15f87ed`). 하네스 워크로그(`.harness/worklog.md`)와 별개 파일 — 정리(삭제/비움) 여부는 사용자 보류
- `.harness/worklog.md` 500라인 초과로 `archive/worklog-2026-06-03.md`로 이동, 새 worklog 시작

### 다음 액션
- mom test 친구 배포 + 인터뷰 4문항 → admin 검수
- §11·§12·§15 백엔드 결정성 LLM 실출력 모순·품질 점검 (배포 후 §15·§17·§19·§20 본문)
- 통신판매업 신고 + 포트원 PG 가맹점 심사
