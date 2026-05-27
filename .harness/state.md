# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-27 23:28
## 마지막 업데이트: 2026-05-27 23:28
## 현재 모드: bypassPermissions

### 현재 집중

- V18-V25 누적 (학교 데이터 통합·hero UX·정합성 audit) 모두 prod 배포 완료. PROMPT_VERSION v5.25-global-abroad-synonym. 다음은 사용자 직접 prod 검증 + mom test 진행.

### 이어서 할 것

1. V25 prod 배포 (`b8c9154`) 사용자 직접 확인 — hero 0.5 단위 별·점수·V24 라벨·VersionFooter 정상 작동
2. 영진 외 sample mom test — §16·§17·§18 본문 라벨이 친화 변환 형태로 노출되는지
3. 5 적성 점수 raw cutoff 다음 calibration 변경 시 V25 헤더 가드 작동 확인

### 막힌 것

- 없음

### 사람 판단 필요

- Mom test 5~10명 모집·정성 피드백
- 방향성 시스템 정비 (score.ts / categoryScores / 체육 명명) — 다음 세션 일정
- DirectionKey 'global' → 'abroad' 코드 통일 여부 (V25는 prompt instruct만, 코드 명명은 그대로)

### 백로그 요약

- 대기 중: 6개
- 최근 추가: 2026-05-27 — DirectionKey 'global' → 'abroad' 코드 통일

### 진행 상황

- [x] sajutalk MVP Phase 1-20 + 만세력 보정 production 배포
- [x] eduluck 기획 + Phase 0-9 (Supabase·만세력·UI·E2E·Vercel deploy)
- [x] 정밀 진단 prompt v3 — Sonnet 4.6 100/100
- [x] Phase A-F 만세력 화면 정통 명식판 전환
- [x] 운영 안정성 hotfix 5건
- [x] prompt 강화·대학 권유 정직성 정책
- [x] Phase G 가족 정보 옵션화
- [x] 학운 알고리즘 코드 결정성 계산화
- [x] 실제 사주 calibration (jaeho·POSTECH·울산대)
- [x] Confidence 구간 도입
- [x] Self-test 인프라
- [x] Phase H 13-6 스텝 UX 단순화
- [x] 가독성 Phase 1·2 (v6 prompt 92.8)
- [x] 6-5 스텝 단순화
- [x] SSE 스트리밍 진단 로그
- [x] 가독성 perception UX 5종
- [x] v7 톤 전환 (친근한 이모/언니)
- [x] 해외운 다층 점수제
- [x] A 격국 진로 보강 + B arts-score 모듈
- [x] 재호 비교 보강
- [x] 양인격 추진력형 보강
- [x] 랜딩 카피 A+D 조합
- [x] 40대 어른 calibration N=7
- [x] calibration sample _private 저장
- [x] 사용자 회고 재해석
- [x] 05·06·07 LLM 풀이 검증
- [x] N=7 학운 시스템 ≈97/100 점수
- [x] 정밀 prefetch (옵션 B)
- [x] 공유 URL — DB migration + /api/share + /share/[token]
- [x] calibration sample PII 분리
- [x] N=11 calibration — 의사 2명·해외 직장인 2명 추가
- [x] 두흥 ⭐⭐⭐ 격상
- [x] 자녀 시간 필수화
- [x] 의약 점수 모듈(medical-score) ⭐
- [x] N=9 학운 시스템 97.8/100점 ⭐
- [x] 부모 사주 입력 제거
- [x] §14 prompt 강화 ⭐
- [x] 부모 사주 옵션 재도입
- [x] 자녀 시간 모름 인라인 가이드
- [x] 정밀 분석 4종 (초기)
- [x] trait 점수 직관 정합 ⭐
- [x] 16섹션 분리
- [x] 학운 10가지 trait 확장
- [x] TraitScoreCard ⓘ + 모달
- [x] "+ 새 진단 시작" 버튼
- [x] 성인/회고용 학년 옵션
- [x] PREMIUM_PROMPT_VERSION 캐시 무효 메커니즘
- [x] hydrate.ts 강화
- [x] SCORING_SYSTEM.md 문서화
- [x] 학운 점수 시스템 v7 — 4-Layer 14 시그너 ⭐
- [x] TraitScoreCard v4 — 별점·그룹 분류 ⭐
- [x] HagunSignerBreakdown
- [x] v8 진로 방향성 8 카테고리 ⭐
- [x] DirectionCard — 8 방향성 카드
- [x] 학습 특성 4개 분리
- [x] LLM prompt §12 8 방향성 baseline 주입
- [x] v10 화면 위계 4단계
- [x] 방향성 카드 펼침 제거
- [x] HAGUN_REFACTOR_ANALYSIS.md
- [x] daeun 청소년기 누락 bugfix + N=9 회귀 복원 ⭐
- [x] calibration sample 03·10·11 md v7 갱신 — Eugene → 홍규
- [x] Counterfactual 검증 신규 — B안 gap 18.1 ⭐
- [x] youthLuck x2 → x1.5 보수화
- [x] LOOCV × Counterfactual 교차 검증
- [x] 학운 v7 표현 약화
- [x] 방향성 v8 정직성 (DIRECTION_SCORING §0+§9+§10 + 김기승 인용)
- [x] DirectionCard ⓘ 면책 모달
- [x] 분포 시뮬 스크립트 — eval-direction-distribution
- [x] recommendedFields 환경 키워드 보강 (Phase C)
- [x] LLM 9 sample §12 자연성 검증 — 환경 단어 9/9, 단정 0
- [x] 정밀 진단 LLM Haiku 4.5 다운그레이드 ⭐ — 9 sample 검증
- [x] 100만 random 사주 시뮬 + cutoff 안정성 검증
- [x] 30단계 내부 티어 + 사회 분포 cutoff 설계 ⭐
- [x] V1-V12 calibration loop · 30~100 시나리오 sweep
- [x] V11 Loop 603 prod hagun-tier + 13명 self-test 100% 일치 (`466fbf2`) ⭐
- [x] DIRECTION_SYSTEM_v3_RESEARCH.md 작성
- [x] Direction System V1-V12 — Step 0-6 + perfect fit 7/7 ⭐
- [x] V12 Loop 720 hagun + 14명 정합 (`cb2df11`)
- [x] Phase 1-5 정밀 진단 v5 (Part1/2 분리 + 신규 4섹션 + Context·hydrate)
- [x] 가족 공유 풀스택 (`d9077ba`~`df777f2`) ⭐
- [x] v2 30 sub-tier 시스템 도입 (`d8c2307`) ⭐
- [x] tier-schools 옵션 A — sub-tier 별 3~5개 학교 chip (`473b5c0`) ⭐
- [x] hagun-tier refactor v2 (sub-tier 직접 매핑, PROMPT_VERSION v5.11) ⭐
- [x] hagun-tier V13 영진 narrow trigger + 외부변수 안내 prompt ⭐
- [x] Score·티어 audit (4 영역) + Phase A-E 일괄 정리 ⭐
- [x] Playwright e2e 영진·세형 prod 검증 + hero chip raw signer fix
- [x] **V14 physical direction + researchScore + publicForceScore 신규 (`6582b21`)** ⭐
- [x] **V15 명명 통일 (주력 방향성·적성 점수) + 가치 메모 + 대운 발현 시기 라벨 (`2c5ed9a`)** ⭐
- [x] **V16 정규화 16 모듈 0-100 + 두 level 시스템 (`24562fb`·`939a5e8`)**
- [x] **V17 도전 chip 재도입 + 가능·도전 룰 (`6c212ab`)**
- [x] **V18 30 sub-tier 학교 데이터 단일 source + 학과·별도 트랙 (`c21aa4f`)** ⭐
- [x] **V19 generalDetail 세세화 + specialTracks {name, triggers[]} 객체화 (`2cc8077`)** ⭐
- [x] **V20 성인 회고 모드 찬사 멘트 (`10975d8`)** — hero 푸터 + §17 LLM instruction
- [x] **V21 남자 사주 여대 권유 차단 (`6583c26`)** — chip + LLM prompt
- [x] **V22 학교명 약어 풀어쓰기 (`fd812a0`)** — '서·성·한' → '서강대·성균관대·한양대'
- [x] **V23 명리 근거 카드 라벨 친화 변환 (`1cb6996`)** — 영문 ID 제거 + 카테고리 4종 강제
- [x] **V24 10단계 학운 라벨 + hero 점수 + signer ×N fix (`13771be`·`25eb1bf`)** ⭐
- [x] **VersionFooter — 모든 화면 우측 하단 버전 라벨 (`4434676`)**
- [x] **V25 별 0.5 단위 + 정합성 audit fix (`f470c6d`·`b8c9154`)** ⭐
- [x] **verify-v8-prod.ts V24 baseline snapshot 갱신 (`fe013f9`)**
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] V25 prod 사용자 직접 확인 (hero 별·점수·V24 라벨·VersionFooter)
- [ ] Mom test 5~10명 — V18-V25 누적 prompt + UI 정성 검증
- [ ] 방향성 시스템 정비 별도 세션 — score.ts (좀비)·categoryScores (directions 중복)·체육 명명 통일
- [ ] DirectionKey 'global' → 'abroad' 코드 통일 여부 (V25는 prompt instruct만)
- [ ] interpretations.kind 정책 — 2026-05-27 free text 유지로 확정 (CHECK constraint 제거 완료)
- [ ] 외부 변수 모듈 (영진/사주 ✗ + SKY 패턴) → backlog 2026-05-24
- [ ] 음력 입력 UI 토글 추가 (윤달) (선택)
- [ ] 06·08 sample v7 포맷 갱신 → backlog 2026-05-23
- [ ] 의대 sample 2개 받기 → N=5 의약 sample 재검증
- [ ] 외부 100명 검증 (Holland Interest Profiler 동시) → backlog 2026-05-20
- [ ] Deep-dive 일 N회 cap 운영 결정 (테스트 기간 무제한)
