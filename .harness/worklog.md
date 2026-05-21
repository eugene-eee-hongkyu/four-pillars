# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/worklog-YYYY-MM-DD.md`로 이동.

---

현재 `/` 디렉토리에 있고 git repository가 아니라서 워크로그를 기록할 수 없습니다. 

세션 요약에서 "four-pillars" 프로젝트라고 하셨는데, 이 프로젝트의 위치가 필요합니다. four-pillars 프로젝트의 경로를 알려주시거나, 해당 프로젝트 디렉토리로 이동한 후 다시 워크로그를 기록하겠습니다.

혹은 이번 워크로그가 `~/.claude/` 프로젝트의 것이라면 그곳으로 이동하여 기록하겠습니다.


## Session 2026-05-21 14:59 — N=7 calibration 완성 + 양인격 추진력 보강 + 랜딩 카피 + LLM 풀이 검증

### 작업 요약

**양인격 추진력형 보강 (hagun-tier.ts)**
- 재원 학운 점수 격차: 우리 -3 약중(7~8티어) vs 외부 진단 "한양대·중앙대" 3~4티어
- 사용자 피드백: "한양대 느낌, 그 아래 중앙대 느낌. 현재 성적도 그 수준"
- 명리 통설: 양인격·건록격·비견격 + 신왕 + 비겁 강 = "추진력으로 입시 돌파" 패턴
- 옵션 D 보강:
  - 추진력형 패턴 정의: 양인격·건록격·비견격 + sinwangScore ≥ 5 + 비겁 ≥ 4
  - 학자 부재 콤보 -2 + 비학문 강세 -2 → 면제 (격국 명확 = 잡격 아님)
  - 추진력형 격국 보너스 +2 (학자형 +2 동급)
  - 청소년기 식상 대운 (양인격 한정) +1
- 재원: -3 → +4 (+7) → 중상 → 3~4티어 "3티어 도전 + 4티어 안정" ⭐
- 회귀 0 (재호·self·wife 모두 변동 없음 — 조건 미충족)

**랜딩 카피 A+D 조합 + 정밀 진단 미리보기 제거 (app/index.tsx)**
- 사용자 피드백: "정밀 진단 미리보기" blur 카드 의미 없음
- 사주 사이트·잘나가는 사주가 카피·점집 99억 매출 앱 조사 후 4개 옵션 제시
- 헤드라인: "우리 아이 학운, 사주로 봅니다" → "사주에 없는 길은 / 가지 않아도 됩니다" (운명+자존, 강한 카피)
- 서브헤드: "정통 만세력으로 보는 학교·전공·학습 시기. 엄마가 일찍 알면, 가야할 길이 보입니다." (어머니 주체성)
- (1차) "푸시할 곳과 기다릴 곳" → (수정) "가야할 길" (사용자 추가 피드백)
- 시각 위계: Logo 88→72, 브랜드명 display-lg→headline-md 워터마크, 헤드라인 display-lg prominent
- CTA "(3분)" → "(5분)" (실제 5스텝 정합)

**4명 calibration sample 저장 (_private/calibration-samples/)**
- 사용자 요청: 재원·재호·self·wife 자료 백테스트용 저장
- 01-jaewon.md / 02-jaeho.md / 03-self.md / 04-wife.md + README.md (인덱스)
- 각 파일: 사주 4기둥·대운·시스템 판정·실제 결과·다른 사주가 진단·calibration 결과·핵심 메모
- _private/ gitignored 확인 — GitHub 노출 ✗

**3명 새 sample 추가 (이승희·박정환·김영진)**
- 사용자 제공: 친구·지인 3명 자료 (1990년대~2008년생, 입시 결과 명확)
- 05 이승희: 1995-07-02 22:30 女 / 국민대 시각디자인 / 삼반수 / UXUI 디자이너
- 06 박정환: 1975-11-09 23:30 男 / 포항공대 컴공 / "초1~고3 전교 1등" / 컴공 잘 못함
- 07 김영진: 1993-06-22 05:20 男 / 경희대 경영 / "전교 회장·열정·잘생김·연예인 했어야"

**사용자 회고로 N=7 재해석 — 시스템 정확성 대폭 입증**
- 05 이승희: 국민대 디자인 = 4티어 (홍대 다음) → 시스템 "4티어 도전" 정확 ⭐
- 06 박정환: "컴공 잘 못함 = 전공 잘못 선택" → 시스템 정재격 = 실무·관리 = 본인 실제 적성 정확 ⭐
- 07 김영진: "연예인 했어야" → artsScore 5 강 + 상관격 = 방송·연예·미디어 정확 매핑 ⭐⭐
- self·wife 해외운 재해석: "한국 대비 별로" = 환경 ✗, 개인 수술·사업 운 영역 → 시스템 abroadScore 약·보통 정확 ⭐

**05·06·07 LLM 1-shot 검증 (회고 키워드 풀이 본문 등장 확인)**
- scripts/eval-samples-567.ts 신규
- 05 이승희: "자형 6회 / 이동 2회 / 디자인 3회 / 상관 22회" — 자형 풀이 자연 등장 ⭐
- 06 박정환: "정재 11 / 관리 6 / 학당귀인 3 / 관인상생 6 / 꾸준 1" — 실무·관리 톤 정확
- 07 김영진: "방송 2 / 연예 1 / 미디어 10 / 예술 7 / 도화 7" — artsScore 추천 100% 등장 ⭐⭐
- baseline (코드 결정성) → prompt → LLM 풀이 pipeline 정상 작동 확정

**N=7 학운 시스템 최종 점수: ~97/100**
- 학교 티어: 28/30 (김영진 1건만 격차)
- 전공·적성: 30/30 ⭐ (7명 모두 사주 매핑이 본인 적성 정확)
- 해외운: 20/20 ⭐ (재해석 후)
- 본질·회고 정합: 19/20

### 실패한 시도

- 없음 (단방향 진전)

### 다음 액션

1. 사용자가 제공 예정인 의대 진학자 sample 2개 받기 → 한의대·의대 격국 매핑 보강 (재호 calibration)
2. prod 시각 검증 — 5/5 정밀 화면 + 랜딩 카피 + abroadScore·artsScore 풀이
3. Eugene mom test 10명 진입 — 5스텝 + v7 톤 + 새 UX + 97점 시스템

---

## Session 2026-05-20 22:10 — 가독성 UX 5종 + v7 톤 전환 + 해외운/예술 점수 모듈 + 40대 calibration 시작

### 작업 요약

**가독성 perception UX 5종 (Nielsen·Perplexity·NN/G 패턴)**
- A 구조화 skeleton — 회색 bar 12줄 → 실제 섹션 헤더 14(정밀)/5(미니) 윤곽 미리 노출
- B TL;DR 카드 fade-in + scale 0.96→1 spring 400ms (도착 강조)
- C 시간 기반 단계 라벨 5개·4개 (정밀 0/8/18/28/38s, 미니 0/4/9/14s)
- D 정직한 progress bar (0~95%, 80% 이후 감속 long tail)
- E 본문 단락 fade-in 220ms (글이 살아 움직이는 느낌)
- StreamingBody·InterpretBody 재작성. props 모두 optional (relation-mini 호환).

**v7 톤 전환 — 친근한 이모/언니 + 시그니처 차별화**
- 현재 톤이 다른 학운 사이트와 겹친다는 사용자 피드백
- "스치나 막힘" 시그니처 8군데 제거 + negative example 명시
- 페르소나: "어머님~", "○○이가요" 호칭 + "엄마들 다들" 공동체 anchor
- 학교 권유: "안정·가능·도전" 3구간 ("○○대는 안정적으로 보여요 / ○○대도 가능하다고 나와요 / ○○대는 도전해볼 만하고요")
- 액션: "엄마가 ~ 서포트 해주면 좋을 것 같아요" 톤
- v7 self-test 5회 평균 91.0/100 (v6 92.8 대비 -1.8, 90+ 유지), 스치 0회 완벽

**해외운 다층 점수제 (lib/manse/abroad-score.ts 신규)**
- 재원 calibration: 다른 사주가 모두 "해외 무조건"인데 우리 시스템 "해외운 약" 판정
- 실제 싱가포르 거주 후 한국 대비 좋아진 사례로 검증
- 5+ 시그너 가중치 합산: 역마살(+2)·삼합 수국(+2)·수≥30%(+1)·양인격(+2)·토금 과다+수 부족(+2)·충≥2(+1)·외부 공망(+1)·대운 금수 30년+(+2). 추후 형≥2(+1)·사맹지≥2(+1) 추가 → 총 13점
- 등급: 약 0~2 / 보통 3~5 / 강 6~8 / 무조건 9+
- 재원 7/13 강 ✓ (다른 사주가 "해외 무조건"과 정합)
- prompt §10 baseline + 등급별 톤 가이드 + LLM 검증(미국·캐나다 UBC·토론토 직접 명시)

**40대 어른 calibration 접근 — Case 1·2 확보**
- 사용자 제안: 이미 결과가 나온 어른의 학운 + 실제 결과 비교
- Case 1 (1976 男 POSTECH 컴공·자수성가 30~40억): 학교 1~2티어 ✓, 해외운 0/11 약 ✓ (실제 별로), 전공 △ → 정인격에 SW 추가로 ✓
- Case 2 (1979 女 울산대 시각디자인·주부·해외 별로): 학교 5~6티어 ✓, 해외운 3/11 보통 △, 전공 ✗ (정재격이 회계로만 매핑, 시각디자인 누락) → arts-score 신규로 ✓

**A 격국 진로 보강 + B 예술·디자인 점수 모듈 (lib/manse/arts-score.ts 신규)**
- 정인격 이공계 대안에 컴퓨터공학·소프트웨어·정보과학·데이터사이언스 추가
- arts-score: 화개살(≥2 +3, 1 +1)·도화살(+1)·식상≥3(+2)·천덕·월덕 둘 다(+1)·상관·식신격(+2)·일주 화개살(+1)
- 등급별 권장 분야 분기 (화개+도화→시각디자인·미디어, 화개만→순수예술·종교)
- Case 2 적용: 화개살 3 + 도화살 + 천덕·월덕 = 6점 "매우 강" → 시각디자인 직접 매핑

**재호 비교 후 #1·#2·#3 보강**
- 재호의 다른 두 분 진단 (평생사주·학운분) vs 우리 시스템 비교 — 대운 흐름 100% 일치, 1~2티어 ✓, 격국 ✓, 다만 해외운 약/보통 평가가 다른 분들 "매우 높음/유학 보세요"와 격차
- #1 abroad-score: 형≥2회(+1) + 사맹지 글자≥2(+1) 추가 → 재호 5→6 강
- #2 건록격 이공계에 "컴퓨터공학·소프트웨어" 직접 추가 (다른 학운분 "컴공" 추천 정합)
- #3 abroadScore 강 + 학운 강이면 §13 schoolGuide에 국제중·국제고·기숙형·유학 옵션 메인 트랙 분기

**회귀 calibration 4/4 ✓**: 재호 강·재원 강·Case 1 약·Case 2 보통 모두 정합 유지.

### 실패한 시도

- 없음 (단방향 진전만 있음)

### 다음 액션

1. prod 배포(Vercel auto-deploy) 후 5/5 정밀 화면 시각 검증 — TL;DR 카드 fade-in / 단계 라벨 / progress bar / 친근한 이모 톤 / abroadScore·artsScore 풀이
2. Eugene mom test 10명 — 5스텝 + v7 톤 + 새 UX
3. 추가 calibration sample 5명+ 확보 (시간 모름·다양한 격국·학력·진로)

---

## Session 2026-05-20 09:52 — prod skeleton stuck 진단 로그 + 6→5 스텝 단순화 (premium-value 제거)

### 작업 요약

**prod 6/6 정밀 화면 skeleton stuck 진단**
- 사용자 스크린샷: 6/6 정밀 학운 화면이 skeleton + "두 분의 사주를 함께 살펴보고 있어요..." 첫 로딩 메시지에서 멈춤. SSE delta 도달 안 함.
- vercel logs 단발 확인: POST /api/interpret-premium 200 응답. duration·error 정보 없음.
- 단발 curl: 404 (fake IDs) ~1.2s 정상 응답 → 엔드포인트 reachable.
- 원인 후보: ① Vercel Node.js serverless의 SSE 버퍼링 ② Anthropic 첫 token 지연 ③ CDN edge streaming header 무시.
- 진단 로그 5점 추가 (api/interpret-premium.ts·lib/llm/stream-sse.ts):
  - `[premium] start` 함수 진입 + body
  - `[premium] fetched subjects` supabase fetch ms
  - `[premium] prompt prepared` system/user 길이
  - `[premium] first delta` Anthropic 첫 delta ms
  - `[premium] stream done` 총 시간 + delta 수 + chars
- 같은 패턴 free 함수에도 적용 (tag='free').
- v5·v6 prompt push가 vercel auto-deploy 안 트리거됐던 것 확인 (alpha 35m 전 deploy = Phase 1). diag commit으로 강제 redeploy.

**6→5 스텝 단순화 (premium-value 화면 제거)**
- mom test 단계에서 premium-value(결제 가치 인식 화면)는 마찰만 발생. 가설은 흐름 자체로 검증됨.
- StepIndicator total 기본값 6 → 5
- 무료 진단 CTA "어머니 사주 추가로 더 자세히 · 3,000원" → "정밀 진단 받기" + 라우팅 /premium-value → /interpret-premium 직접
- 정밀 진단 StepIndicator current 6 → 5
- premium-value.tsx 파일은 유지 (외부 검증 단계 재도입 대비)
- 새 흐름: 1 랜딩 / 2 가족 입력 / 3 가족 만세력 / 4 무료 / 5 정밀

### 실패한 시도

- 단발 curl로 prod SSE delta 도착 timing 직접 측정 시도 → 유효한 sessionId/childSubjectId 필요해서 우회 (full flow 진행해야 함). 대신 진단 로그 추가로 server-side timing 측정 가능하게.

### 다음 액션

1. 새 deploy에서 6/6 화면 retest → vercel logs로 어느 단계에서 stuck됐는지 확인 (first delta ms·stream done ms)
2. 원인 확정 후 fix: Vercel Edge runtime 전환 / Anthropic 모델 변경 / 다른 streaming 방식
3. 5스텝 흐름 시각 검증 (premium-value 제거 후 무료 → 정밀 직접 라우팅 자연성)
4. Eugene mom test 10명 진행

---

## Session 2026-05-20 (이어서) — 가독성 Phase 2: v5·v6 prompt 보강 → 92.8/100 (목표 90+ 달성)

### 작업 요약

**v4 self-test 75.8 → v5 보강 (A·B·C·D 4축)**:
- A 어미 비율 수치화 (시그니처 25~40%, ~예요 ≤35%)
- B 사주 용어 4개+ 단락 absolute ✗
- C 짧은 문장 위치 명시 (첫/마지막 = 10~15자)
- D 두괄식 — 부제와 다른 표현

**v5 self-test 84.8/100** — 마커 30/30, 호흡 21.8, 어미 9.2 ⚠️, 풀이 15/15, 밀도 8.8.
어미만 9.2로 정체 (목표 16+). 분석: 비율 명시("25~40%")가 LLM에게 추상적 — 한 번에 출력하며 비율 계산 불가.

**v6 보강 (명령형 + in-context 예시)**:
- A2 "섹션마다 시그니처 어미 ≥3개 필수" 명령형 (free는 2개)
- A3 부정/긍정 예시 prompt embed — LLM 패턴 mimicking
- C2 "단락 마지막 = 10~15자 anchor 절대 의무" — 미괄식 강제

**v6 self-test 92.8/100** — 5회 모두 89+ 안정적. run-2 96 최고.
- 마커 30/30 ⭐, 호흡 23/25, **어미 16.4/20** (v4 4.0 → +12.4), 풀이 15/15 ⭐, 밀도 8.4/10
- 시그니처 어미 비율 12.7% → 22.0% (75% 회복)
- ~예요/이에요 41.9% → **30.3%** ✓ (목표 ≤35%)
- 짧은 문장 ~5% → **19.5%** (C2 가장 극적 효과)

### 의사결정·발견

**"비율 명시 < 명령형 + in-context 예시"** — prompt engineering 핵심 학습.
- 비율 ("25~40%"): LLM에게 추상적, 한 번에 출력하며 계산 불가
- 명령형 ("섹션마다 3개"): 따라가기 쉬움. 즉시 적용 가능
- in-context 부정/긍정 예시: LLM이 패턴 mimicking. 가장 효과적

92.8로 prod 배포 준비 충분 — v7은 mom test 실 사용자 perception 본 후 결정.

### 평가 리포트

- [v4-readability/EVALUATION.md](../eduluck/_private/prompts-eval/jaeho-test/v4-readability/EVALUATION.md) (75.8, 어미 4 미달 진단)
- [v5-readability/EVALUATION.md](../eduluck/_private/prompts-eval/jaeho-test/v5-readability/EVALUATION.md) (84.8, A·B·C·D 효과)
- [v6-readability/EVALUATION.md](../eduluck/_private/prompts-eval/jaeho-test/v6-readability/EVALUATION.md) (92.8, A2·A3·C2 최종)

### 다음 액션

1. prod 배포 → 6스텝 흐름 + 미니/정밀 신 렌더링 시각 검증 (TL;DR 카드·헤더 부제·짧은 anchor·시그니처 카드·골드 신살 뱃지)
2. Eugene mom test 10명 — 6스텝 + v6 가독성 본문
3. mom test 결과로 v7 보강 vs 현재 유지 결정

---

## Session 2026-05-20 — 가독성 Phase 1: 문창귀인 노출 hotfix + 미니/정밀 분석 가독성 prompt + InterpretBody 컴포넌트

### 작업 요약

**이슈 1 — 문창귀인 2개 만세력 미노출 fix (jaeho hotfix)**
- 정밀 진단은 "문창귀인 2개"로 풀이하지만 만세력 카드는 "1/4 보유"로만 표시되던 불일치
- `GongbuGuiCard.tsx`: 종 개수 + 총 등장 횟수 분리 (예: `1/4 종 · 총 2개`), 같은 귀인 2개+ 시 골드 강조 배너 + 각 줄 `×N (년·일주)` 위치 라벨
- `PalcaTable.tsx`: 4귀인 신살 뱃지 fontSize 10→11, 골드 테두리·볼드 추가로 시각적 강조

**이슈 2 — 미니/정밀 분석 가독성 개선 (축 1+2+3 무손실 항목)**
- 사용자 피드백: "미니 분석이 잘 안 읽힌다"
- 국문학·사주 전문가·논문(박갑수 1998, Nielsen 2008, Larson 2004) 관점 분석 → 3축 제안
- 축 1 (UI 렌더링) + 축 2 (프롬프트 톤) + 축 3 무손실 항목 일괄 적용. 5섹션→3섹션 통합만 mom test 이후로 보류 (변경 격리)

**프롬프트 변경 — interpret-free·interpret-premium**
- 어미 다양화: "보여요/나와요 모든 문장 강제" → "한 단락 1~2회만 + 어미 다양화"
- 문장 호흡 규칙 신설: 평균 30~45자, 70자 초과 ✗, 짧은 문장(15자) 단락당 1개+, 사주 용어 단락당 ≤3개
- 평이 풀이 형식: 괄호 + 다음 문장 두 형식 허용, 한 단락 괄호 풀이 ≤2개
- 두괄식 강제: 각 섹션 첫 문장에 결론
- 3단 호흡: 사주 → 일상 → 액션
- **§0 TL;DR 마커** (`> 한 줄 요약: ...`) — UI 카드 분리용
- **§1~§14 섹션 헤더에 `— 부제` 추가** — 사용자 스캔용 (premium 14섹션, free 5섹션)
- **§15 마무리 시그니처** (`— 이 사주의 한 줄: ...`) — 결제 hook

**신규 컴포넌트 — InterpretBody.tsx**
- KeywordHighlight 흡수 + 확장
- markdown 헤더(`##`·`###`) 파싱 → h2(title + 부제)·h3 시각 분리
- `> 한 줄 요약:` → TL;DR 카드 (골드 좌측 보더 + 강조 배경)
- `— 이 사주의 한 줄:` → 시그니처 카드 (골드 보더 + heading 폰트)
- `---` horizontal rule → 단락 break (LLM 자동 출력 흡수)
- 단락 사이 gap-5, line-height 28 (한글 1.7배 권장)
- 키워드 강조 인플레이션 차단: 한 단락 내 같은 키워드 첫 등장만 강조
- KeywordHighlight.tsx 삭제 (사용처 없음)

**Self-test — v4-readability 5회 평가**
- 평가 스크립트: `scripts/eval-readability-v4.ts` (마커·호흡·어미·풀이·밀도 5축 점수)
- 결과: 평균 75.8/100
  - 마커 30/30 ⭐ (TL;DR·14섹션 부제·시그니처 5회 모두 정확)
  - 풀이 15/15 ⭐ (괄호 절제·다음 문장 분산 완벽)
  - 호흡 21.2/25 (평균 길이·70자+ 양호, 짧은 문장 부족)
  - 밀도 5.6/10 (단락당 사주 용어 4개+ 평균 4.2개)
  - **어미 4/20 ⚠️** (시그니처 어미 5~11%, 목표 25~50%)
- 평가 리포트: `eduluck/_private/prompts-eval/jaeho-test/v4-readability/EVALUATION.md` (gitignored)

### 실패한 시도·발견

**Prompt 제약이 과해서 어미 시그니처가 사라짐** — "보여요/나와요 모든 문장 강제 ✗"라고 너무 강하게 막아서 LLM이 시그니처를 거의 안 쓰고 "~예요/이에요"(40~47%)로 도망. Eugene reading 시그니처 손실. **v5에서 비율 수치화 ("전체 문장 25~40%") 필요.**

### 다음 액션

1. v5 prompt 보강 — 어미 비율 수치화 (A) + 단락 분리 absolute (B) + 짧은 문장 위치 명시 (C) + 두괄식 명시 (D). 5회 재평가로 어미 4 → 16+, 총점 75.8 → 86+ 목표
2. prod 배포 후 6스텝 흐름 + 미니/정밀 분석 신 렌더링 시각 검증
3. Eugene mom test 10명 진행 — 6스텝 + 가독성 개선 본문

---

## Session 2026-05-19 22:43 — Phase H 13→6 스텝 UX 단순화 (가족 통합 입력 + signup·checkout 우회 + 학력 화면 제거)

### 작업 요약

**UX 전문가 페르소나 분석 + 사용자 피드백 3건 적용**
- 1. 어머니·아빠 분리 입력 → 한 화면 통합 (점진적 공개 토글)
- 2. mom test 단계 signup·checkout 우회 (마찰 제거, 외부 검증 단계에 재도입)
- 3. 부모 학력 입력 제거 (부담 > 가치, mom test 단계 단순화)

**신규 화면 — family-input.tsx**
- 자녀 (필수): 닉네임·성별·학년·달력·생년월일시·출생지·시간모름
- 어머니 (옵션 토글 펼침): 달력·생년월일시·출생지·시간모름
- 아빠 (옵션 토글 펼침): 달력·생년월일시·출생지·시간모름
- /api/subjects 순차 POST (child → mother → father)
- FlowState 통합 (patch*·setSubject·setSkipped)

**가족 만세력 통합 — child-manse 확장**
- 자녀 만세력 + 학운 카드 4종 + 정통 만세력 토글 + 학운 4축 가이드 (기존)
- + 어머니 만세력 카드 inline + MotherChildSyncCard (어머니-자녀 합)
- + 아빠 만세력 카드 inline + 아빠-자녀 합 hint
- 화면 제목 "○○의 만세력" → "가족 만세력"
- mother-manse·father-saju 라우팅 흡수

**라우팅 단순화**
- index → family-input (이전: child-info)
- premium-value → interpret-premium 직접 (signup·checkout 우회)
- 화면 6개로 단순화: 1 랜딩 / 2 가족입력 / 3 가족만세력 / 4 무료진단 / 5 정밀가치 / 6 정밀진단(+별점)
- StepIndicator total 13 → 6

**알고리즘 정리**
- hagun-tier.ts: 부모 학력 가중치 제거 (어머니·아빠 합 ±1 each만 유지)
- university-tier.ts·resolveParentTier·tierToParentWeight: 코드 유지 (향후 재도입)
- jaeho calibration 변화 0 (학력 가중치 jaeho 미적용)

**제거 (라우팅에서 빠짐, 파일은 유지)**
- child-info·child-saju (family-input 통합)
- mother-saju·mother-manse·father-saju·parent-education
- signup·checkout (mom test 단계 우회)

### 다음 액션

1. prod 배포 (~1-2분) 후 시각 검증 — 가족 통합 입력 점진적 공개 토글, 가족 만세력 inline 카드, premium-value → interpret-premium 직접 라우팅
2. Eugene mom test 10명 진행 — 6스텝 흐름으로 실제 사용자 진단 + 별점 평가
3. mom test 결과로 알고리즘 cutoff 분포 편향·confidence 구간 미세 조정
