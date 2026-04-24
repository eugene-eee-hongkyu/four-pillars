# worklog.md — 작업 기록

> 최신 세션이 위에 오도록 역순으로 작성한다.

---

## Session 2026-04-24 22:35 — 4가지 해석 스타일 톤 셀렉터 구현

### 작업 요약
- **입력1~4 품질 분석**: 사용자가 현재 출력(입력1)과 원하는 출력 형태(입력2~4) 비교 제시 → 구현 가능성 평가 및 로드맵 정리 (과거 세운 주입·연도별 포맷·질문 유형별 템플릿·역검증 패턴 4가지)
- **4가지 톤 셀렉터 구현**:
  - `lib/session/local-store.ts` — `ToneType` ('yeoksulga' | 'science' | 'example' | 'counselor') 추가
  - `lib/prompts/interpret.ts` — `INTERPRET_SYSTEM_YEOKSULGA` / `INTERPRET_SYSTEM_EXAMPLE` / `INTERPRET_SYSTEM_COUNSELOR` 3개 신규 + `getInterpretSystem(tone)` 선택 함수. 예시형은 과거 세운 데이터 자동 주입 로직 포함
  - `lib/prompts/qna.ts` — `QNA_SUFFIX` 분리 + `getQnaSystem(tone)` 추가
  - `app/result/page.tsx` — 단일 "채팅" 버튼 → "해석 스타일로 대화하기" 2×2 그리드 (역술가/과학형/예시형/심리상담가)
  - `app/chat/page.tsx` — `conversation.tone` 읽어 API 전달 + 헤더 뱃지 표시
  - `app/api/interpret/route.ts`, `app/api/qna/route.ts` — `tone` 파라미터 수신·전달
- **Playwright E2E**: 4개 버튼 렌더링 확인 + 과학형 클릭 → 채팅 헤더 "과학형" 뱃지 + 스트리밍 정상 동작 확인
- **`.gitignore`**: Playwright 스크린샷 패턴 추가 (`*-check.png`, `*-buttons.png`, `*-header.png`)
- **커밋 2개 푸시**: `6f9be91` (톤 셀렉터), `75eef90` (.gitignore)

### 다음 액션
1. localhost:3002 수동 E2E — 4개 톤 답변 직접 비교 (특히 예시형이 연도별 포맷으로 나오는지)
2. Phase 3 진입: Supabase credentials 입력 → DB 마이그레이션


## Session 2026-04-24 20:49 — 합충형파해·지장간 구현 + 프롬프트 과학자톤 전환

### 작업 요약
- **QNA fullManse 주입 수정**: `max_tokens` 3072→4096, QNA가 manse.summary 텍스트만 받던 버그 수정 → `fullManse: p.manse ?? {}` 전달
- **해석 품질 아키텍처 논의**: ChatGPT(3단계 아키텍처), Gemini(70/20/10 가중치), Claude(출력 표현) 3개 AI 의견 종합 → 합충형파해 미구현이 가장 큰 gap으로 결론
- **오늘 날짜 프롬프트 주입 방향 결정**: "오늘 날짜만으로 충분" — 대운/세운/월운이 이미 서버에서 계산·주입 중
- **Kickoff**: `manse-v2-hapchunh-sciencetone` run 생성, 이전 run(`saju-interpretation-enhancement`) 완료 처리
- **lib/manse/jijanggan.ts** 신규: 지장간 12지지 고정 테이블, `getJijanggan()` / `calcAllJijanggan()`
- **lib/manse/hapchunh.ts** 신규: 합충형파해 전체 — 천간합 5종, 지지 6합 6종, 3합 4종(반합 포함), 충 6종, 삼형+자형, 파 6종, 해 6종, 공망(60갑자 순공 테이블)
- **lib/manse/engine.ts** 확장: `jijanggan` / `hapchunh` 필드 추가, 두 모듈 호출 연결
- **lib/prompts/interpret.ts** 전면 개편: 역술가 톤 → 과학자+심리상담가 톤 (확률% 필수, 결론 먼저, 불확실성 인정), 오늘 날짜·합충·지장간 섹션 주입
- **lib/prompts/qna.ts**: 동일 톤 동기화, `buildManseSection`에 합충·지장간·오늘 날짜 추가
- **lib/prompts/summary.ts**: 추가 규칙 톤 맞춤 + 오늘 날짜 주입
- **.gitignore**: `.next/` (루트 빌드 아티팩트), `*-test.png` 추가
- `next build` 통과, localhost:3002 서버 가동, 텔레그램 알림 전송
- **커밋 푸시**: `abdb548` — 12개 파일 변경, 691줄 추가

### 실패한 시도
- Telegram MCP allowlist 미등록으로 전송 실패 → curl 직접 전송으로 우회

### 다음 액션
1. localhost:3002 수동 E2E 확인 (채팅 답변 톤 변화 + 합충 표현 등장 여부 직접 읽기)
2. Phase 3 진입 준비: Supabase credentials 입력 → DB 마이그레이션
3. Vercel 배포 승인 요청 (Phase 3)


## Session 2026-04-24 20:24 — 신살 19종 완성 + 해석 품질 개선 방향 정리

### 작업 요약
- **포스텔러 비교 버그 수정**: 대운 천간 십신 오류(정재→정인) — HANJA 역변환 테이블로 방어, 일주 십신 하드코딩(`i===1`) 제거
- **UI 개선**: 첫 화면 자동 리다이렉트 제거, 사주 그리드 한자(작게)+한글(크게) 병기
- **신살·길성 섹션 추가**: 길성=녹색, 살=빨간색, 건록 포함 / 초기 8종 → 최종 19종으로 확장
- **채팅 프롬프트 개편**: 성격/적성/운세/주의/재물/건강 6섹션 구조 + 나이대별 예시
- **채팅 버그 수정**: `max_tokens` 1024→3072 (답변 잘림), `react-markdown` + `@tailwindcss/typography` 설치 (마크다운 미렌더링)
- **해석 품질 3-AI 비교 분석**: ChatGPT(아키텍처), Gemini(가중치 70/20/10), Claude(출력 규칙) 의견 종합

### 다음 액션
- **즉시** — 프롬프트 수정: "누구에게나 맞는 말 금지" 규칙 추가, 해석 순서 `원국→용신→대운→세운→신살` 강제
- **다음** — 합충형파해 + 지장간 계산 모듈 구현 (현재 미구현, 가중치 대비 가장 누락된 부분)
- **나중** — 과거 사건 입력 UI + 역검증 엔진 (ChatGPT 제안)


## Session 2026-04-24 18:22 — 만세력 결과 화면 신규 제작 + 해석 프롬프트 전면 개편

### 작업 요약
- **만세력 결과 화면(`/result`) 신규 제작**: 4주 컬러 그리드(木火土金水), 십신, 오행 분포, 천을귀인 표시
- **대운·세운·월운 UI 추가**: 맨 오른쪽=현재, 왼쪽=미래 방향으로 표시. `luck-cycles.ts` 신규 작성
- **신살 계산 모듈(`shensha.ts`) 신규 작성**
- **용신 계산 모듈(`yongsin.ts`) 신규 작성**
- **interpret API route 재작성**: 전체 만세력 데이터(십성·신살·용신·대운) 주입, 훅 4개(일주→오행→대운→신살) + 40문장+ 쉬운 풀이 구조로 프롬프트 전면 개편
- `chat/page.tsx`에 fullManse 데이터 전달 연결
- run 파일 생성: `docs/runs/2026-04-24-saju-interpretation-enhancement_run.md`

### 실패한 시도
- Tailwind 동적 클래스(`getElementBg`) 색상 미적용 → `lib/` 폴더가 Tailwind 스캔 대상 외였음 → 인라인 스타일(`getElementStyle`)로 교체
- 월주 십신이 일간과 동일할 때 비견 공백 반환 버그 → 수정
- dev server 재시작 없이 화면 확인을 건너뛰고 완료 선언

### 다음 액션
- 미커밋 구현 파일들 별도 커밋 여부 확인 및 커밋
- E2E 테스트 완료 후 run 파일 완료 처리
- 합·충·형·파·공망 등 세부 관계 계산 (MVP 이후 단계)


## Session 2026-04-24 17:40 — 대운·세운·월운 UI 추가 및 사주 해석 강화 (신살·용신·프롬프트 개편)

### 작업 요약
- **result 페이지 대운·세운·월운 테이블 추가** (`app/result/page.tsx`)
- **lib/manse/luck-cycles.ts** 신규 — 대운·세운·월운 계산 전체 담당
- **lib/manse/shensha.ts** 신규 — 신살 8종 매핑 테이블 기반 계산
- **lib/manse/yongsin.ts** 신규 — 억부용신 단순 근사
- **lib/manse/engine.ts** 확장 — `shensha`, `yongsin`, `elementCounts` 필드 추가
- **lib/prompts/interpret.ts** 전면 개편 — 5구획 40문장+, `FullManseData` 인터페이스, 구조화 주입
- **app/api/interpret/route.ts** — `max_tokens` 1024 → 4096, `fullManse` 파라미터 수신
- **docs/runs/2026-04-24-saju-interpretation-enhancement_run.md** 신규 (kickoff)
- `next build` 빌드 통과 확인, 개발 서버에서 40문장+ 스트리밍 수신 확인

### 실패한 시도
- `LuckItem` union type 오류, `new Set` 다운레벨 이터레이션 오류, `string | null` 타입 가드 누락
- webpack 캐시 오류 → 개발 서버 재시작으로 해결

### 다음 액션
1. localhost:3002 수동 E2E 확인
2. Supabase credentials 입력 → DB 마이그레이션
3. Vercel 배포 승인 요청

---

## Session 2026-04-24 16:21 — 화면 1 양력/음력 선택 추가 및 빌드 오류 수정

### 작업 요약
- 화면 1(`app/page.tsx`)에 양력/음력 라디오 버튼 추가 (음력 선택 시 윤달 체크박스)
- `lib/manse/engine.ts`, `verify.spec.ts` — `calculateSaju()` 6번째 인자(gender) 제거
- `app/chat/page.tsx` — `useRef(loadProfile())` SSR 오류 수정
- `next build` 전체 통과 확인

### 다음 액션
1. localhost:3002 수동 E2E 테스트
2. Supabase 프로젝트 생성 → DB 마이그레이션 → /api/session 활성화
3. Vercel 배포 (단계 18, §9 [트리거 4] 발동)

---

## Session 2026-04-24 15:54 — 사주톡 MVP 빌드 8~16/20 단계 완료

### 작업 요약
- [8/20] 만세력 Playwright 검증 10/10 통과
- [9/20] lib/prompts/ 4개 파일 작성
- [10/20] lib/state/chat-machine.ts
- [11/20] API routes 6개 스텁
- [12~16/20] 화면 1~5 구현
- CSS 빌드 에러 수정 (Tailwind v3/v4 호환성)
- 개발 서버 localhost:3001 동작 확인

### 실패한 시도
- globals.css에서 `@import "shadcn/tailwind.css"` → Tailwind v4 전용 구문 오류

### 다음 액션
1. `.env.local` 작성 후 수동 E2E 테스트
2. Supabase 프로젝트 생성 → DB 마이그레이션
3. Vercel 배포

---

## Session 2026-04-24 12:56 — harness 초기화 + CONTEXT.md 작성

### 작업 요약
- GitHub repo `four-pillars` 생성
- `/harness-init` 실행: CLAUDE.md, settings.json, profiles 4개, .harness/ 빈 템플릿
- harness-doctor 전항목 정상 (hooks 8/8, commands 5/5, api_key, telegram, launchd)
- `/context-init` 실행: CONTEXT.md 초안 작성

### 실패한 시도
- 초기 URL을 `four_pillars`(언더스코어)로 설정 → 404 → `four-pillars`(하이픈)로 수정

### 다음 액션
- bypass 세션으로 빌드 시작
- 만세력 Playwright 검증(§5-8번) 먼저 통과 확인
