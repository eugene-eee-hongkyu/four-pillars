# decision.md — 의사결정 기록

> 대안 비교와 선택 이유가 있는 경우만 기록한다.

---

## 2026-05-19: 어머니·아빠·부모 학력 모두 옵션화 + Phase G 13스텝 flow

- **선택**: 어머니 사주 옵션화 (스킵 가능, 권장 안내) + 아빠 사주 신규 화면 (옵션) + 부모 학력·전공 신규 화면 (옵션). 화면 11(아빠 사주), 화면 12(부모 학력), 화면 13(정밀 진단) 두 화면 분리.
- **대안 검토**:
  - 어머니 필수 유지: §14 어머니-자녀 합 풀이가 정밀 진단 핵심 가치. 옵션화 시 풀이 축약 우려.
  - 어머니 옵션화 (선택): 이혼·사별·입양 등 어머니 정보 없는 사용자 배려 + conversion ↑.
  - 한 화면 묶음: 아빠 사주 + 부모 학력을 한 화면에 섹션화. 스텝 1개 추가.
  - 두 화면 분리 (선택): 화면별 책임 명확, 사용자가 스킵 결정 명확.
- **선택 이유**: 사용자 명시적 결정. 어머니 옵션화는 명리 깊이 손실 약간 있지만 사용자 배려 우선. 두 화면 분리는 UX 명확성.
- **영향 범위**:
  - DB: subjects.role 'father' 추가 + subjects.education_json 컬럼
  - FlowState: father·motherStatus·fatherStatus·motherEducation·fatherEducation·parentEducationStatus + 8개 신규 액션
  - 화면: father-saju, parent-education 신규 + mother-saju에 스킵 버튼 + StepIndicator 11→13
  - API: /api/subjects role 확장 + /api/parent-education 신규 + /api/interpret-premium ctx 확장
  - Prompt: motherManse null 허용, fatherManse·parentEducation 옵션, §14 자녀 톤 자동 전환
- **되돌리는 방법**: revert `c5fa3ac` (Phase G 커밋). DB는 컬럼만 추가했으므로 NULL 채워두면 호환. role 'father' row가 있으면 정밀 진단 코드만 fallback.


## 2026-05-19: 부모 사주·학력 환경 변수 ±1~2단계 티어 조정 메커니즘

- **선택**: 사주 베이스 티어(학운 10단계 매핑)에 부모 사주 합 + 부모 학력을 ±1~2단계 환경 변수로 명시적 조정. 사주 베이스를 절반 이상 뒤집지 않음.
- **대안 검토**:
  - 보조 풀이만 1~2문장 (이전 패턴): LLM이 티어 조정에 활용하기 모호. 환경 영향이 매번 흔들림.
  - 환경 변수 점수화 (선택): 어머니-자녀 합 ±1 / 아빠-자녀 합 ±0~1 / 부모 학력 ±1 / 한도 총 ±2 명시.
  - 자녀 사주에 부모 사주 영향 가중치 50% 적용: 명리 본질 흔들 위험.
- **선택 이유**: 사용자 질문 "엄마, 아빠의 운세와 엄마, 아빠의 학교로 티어가 1-2단계 오르거나 내릴 수도 있나?"에 명리·교육 사회학 양쪽으로 Yes. 메커니즘 명문화로 LLM 일관성 ↑.
- **영향 범위**: `eduluck/lib/prompts/interpret-premium.ts` + `.md` §13 가이드에 표 + 예시 + 한도 명시.
- **되돌리는 방법**: revert `c77f180`. 환경 변수를 다시 보조 풀이 톤으로 되돌릴 수 있음.


## 2026-05-19: 대학 권유 정직성 — 학운 10단계 + 1~10티어 + 비대학 트랙

- **선택**: 모든 사주에 SKY·상위권 짚는 패턴을 폐기하고 학운 강약 10단계 + 한국 대학 1~10티어 + 의치한약 + 전문대·비대학 트랙으로 분기. "거짓 희망 금지" 명문화.
- **대안 검토**:
  - 강/중/약 3단계 (`d56c08b`): 사용자 피드백 — 부족, 10단계 세분화 요청.
  - 10단계 + 1~10티어 (선택): 사용자가 1~7티어 직접 지정, 8~10은 한국 입결 인식 기준으로 보강.
  - 모든 사주 SKY 짚기 (이전): jaeho 100점 케이스 기준이라 학운 약한 사주에 거짓 희망 → 어머니에게 손해.
- **선택 이유**: 사용자 명시 "낮은 대학 나오면 그대로 / 지방대·대학 안 가기도 솔직 권유". v3 PROMPT의 "구체 학교명 명시" 패턴은 살리되 범위는 사주 솔직히.
- **영향 범위**: `interpret-premium.ts`·`.md` §13 가이드 + 금지 섹션 ("단정적 부정"으로 정확히 + 사주 솔직 풀이는 허용).
- **되돌리는 방법**: revert `f0031ea` + `c77f180`. 다만 사용자 정책 결정이라 되돌리기 권장하지 않음.


## 2026-05-19: jaeho 개인정보 git history 제거 방식 — filter-repo (history rewrite)

- **선택**: `git filter-repo --path ... --invert-paths` 3회 (jaeho-test 디렉토리 + test-jaeho.sh + test-jaeho-2.sh) + force push
- **대안 검토**:
  - **A (선택) filter-repo + force push**: history에서 완전 제거. 안전. force push 필요(협업자 없으면 무관).
  - B (tombstone commit): 현재 commit에서 삭제 + .gitignore. 과거 commit 열람 가능 → 개인정보 잔존.
  - C (그대로 두기): 이미 _private/로 이동 + gitignore됨. public repo 우려.
- **선택 이유**: (1) 이름·생년월일시 등 미성년자 개인정보 잔존 우려, (2) 협업자 0명이라 force push 영향 미미, (3) filter-repo가 자동 백업(`.git/filter-repo/`)을 만들어 롤백 가능.
- **영향 범위**: 모든 commit hash가 재작성됨 (be4f266 → 7cbf98a). origin remote 자동 제거 → 수동 재추가 필요. upstream tracking(`branch.main.remote`) 동시 손실 → `git branch --set-upstream-to=origin/main main`로 복구. 다른 clone이 있으면 `fetch + reset --hard origin/main` 필요.
- **되돌리는 방법**: `.git/filter-repo/commit-map` 백업 보유 — 원본 hash를 알고 있으면 `git reset --hard <원본_hash>` 후 다시 force push. 완전 안전망은 GitHub Events API의 PushEvent 또는 별도 mirror clone.


## 2026-05-19: 격국·12운성·납음 데이터 — 모듈 추가 vs LLM 자체 계산 → LLM 자체 계산 채택

- **선택**: `ManseResult`에 격국·12운성·납음 필드를 추가하지 않고, system prompt에 "반드시 명시" 강제 + `ilganLabel()` 일간 표기만 user message에 명확히 노출 → LLM(Sonnet 4.6)이 4기둥+일간으로 자체 계산
- **대안 검토**:
  - **A (선택) LLM 자체 계산**: 즉시 적용 가능, 코드 변경 최소. 정확도는 LLM 명리 지식 의존.
  - B (계산 모듈 추가): `lib/manse/`에 gyeokguk/unsung/napum 3개 모듈 + 테스트 + ManseResult 확장 + buildPrompt에 주입. 정확도 확정·deterministic. 작업 1~2 세션.
- **선택 이유**: (1) v3 PROMPT.md가 동일 경로(prompt 강제)로 100/100 달성한 선례, (2) Sonnet 4.6의 명리 기본 지식이 격국·12운성·납음 계산에 충분, (3) production 첫 출력 검증 후 부정확하면 그때 모듈화해도 늦지 않음, (4) 14섹션·75~95문장 구조 적용이 더 시급한 가치.
- **영향 범위**: `eduluck/lib/prompts/interpret-premium.ts`만 변경 (ilganLabel·gradeSpec 헬퍼 추가, system prompt v3로 교체). user message에 일간/오행/지장간 월령 명시. ManseResult 미변경.
- **되돌리는 방법**: 정확도 검증 실패 시 `lib/manse/gyeokguk.ts`·`unsung.ts`·`napum.ts` 추가 후 ManseResult 확장. 현재 prompt는 그대로 유지(LLM이 받은 데이터만 풍부해짐).


## 2026-05-19: 정밀 진단(화면 11) 모델 — Sonnet 4.6 + v3 prompt 채택

- **선택**: Sonnet 4.6 + jaeho-test/v3/PROMPT.md (75~95문장, 14 섹션, 격국·12운성·납음, 전공·중·고·대 구체 명시)
- **대안 검토**:
  - Opus 4.7 v3 (90점): 톤 시그니처 "보여요·나와요" 14회 (Sonnet 83회 대비 1/6). 비용 5배. 학교 specific은 Sonnet과 유사.
  - Sonnet 4.6 v2 (92점): 13 섹션, 격국·12운성 누락.
  - Sonnet 4.6 v3 (100점, 선택): 격국·12운성·납음 강제 + 톤 시그니처 자연 + 학원·동네·식물 모두 구체.
- **선택 이유**: (1) 명리 전문가 페르소나 100/100 만점, (2) Opus 대비 비용 1/5, (3) "보여요·나와요" 어미 자연·markdown emoji/bold 자제로 Eugene 샘플 reading 시그니처 정확 답습, (4) 1 iteration 만에 만점 도달 — 추가 튜닝 비용 없음.
- **영향 범위**: prompts/interpret-premium.md를 v3 system prompt로 교체 예정. user message는 어머니 사주 + 어머니-자녀 합 섹션 추가 (현재 v3는 자녀 단독). lib/prompts/interpret-premium.ts buildPrompt 함수 학년 4구간 분기 확장.
- **되돌리는 방법**: prompts/interpret-premium.md 이전 버전 복원. Opus로 모델 변경은 .env.local ANTHROPIC_MODEL만 변경.


## 2026-05-19: 로고 컨셉 — B (사주 4기둥 그리드) 채택

- **선택**: 컨셉 B — 2×2 그리드 (3 청회 + 1 골드 = 일간 강조)
- **대안 검토**:
  - A (한자「運」): saju 정통성 신호 강함. 한자 거부감·글로벌 확장 제한.
  - **B (4기둥 그리드, 선택)**: brand core(만세력) + PalcaTable 시각 일관 + favicon 16~24px 가독 + 한자 거부감 없음.
  - C (새싹+별): 학부모 친근. saju 차별화 약함.
- **선택 이유**: (1) DESIGN v1.1 §5 PalcaTable 컴포넌트와 같은 시각 언어, (2) 만세력 정확도 차별점과 직접 연결, (3) 2026 Neo-Minimalism 트렌드 부합, (4) responsive (favicon·app icon·OG image 모두 동일 기하학 작동).
- **영향 범위**: eduluck/assets/{favicon, icon, adaptive-icon, splash, og-image}.png 신규. components/ui/Logo.tsx (react-native-svg). app/index.tsx 랜딩에 표시. app.json icon·splash·adaptiveIcon 경로 명시.
- **되돌리는 방법**: scripts/gen-logo.py 코드 수정 → 다른 컨셉 PNG 재생성. Logo.tsx SVG 좌표 변경. (rollback은 git revert).


## 2026-05-19: 회원가입 방식 — OTP 메일 폐기 + 이메일·비번 즉시 가입 + 자동 로그인

- **선택**: signInWithPassword 먼저 → 실패 시 signUp 자동 폴백. 진입 시 sb.auth.getUser()로 자동 로그인 체크.
- **대안 검토**:
  - OTP 메일: Supabase 무료 hourly 3~4건 rate limit + spam 위험 + OTP 길이(6/8) 호환 + reload 시 다시 OTP. 학부모 UX 마찰 큼.
  - **이메일·비번 (선택)**: 1 폼·1 버튼 "계속하기" + cookie persist로 reload 자동 복원. 마찰 최소.
- **선택 이유**: MVP rate limit 막힘 실제 경험 + 학부모 OTP 메일 spam 분류 위험 + reload 시 OTP 다시 받는 UX 부담.
- **영향 범위**: app/(flow)/signup.tsx 재작성. Supabase Dashboard에 "Confirm email" OFF 필수 (Eugene 작업).
- **되돌리는 방법**: signInWithPassword·signUp 제거 → signInWithOtp + verifyOtp 복원.


## 2026-05-18: eduluck API routes Vercel 작동 방식 — A안 (Vercel Functions) 채택

- **선택**: A안 — eduluck/api/*.ts 폴더 추가 (Vercel 표준 functions 형식). 기존 app/api/+api.ts 코드 그대로 sync.
- **대안 검토**:
  - A안 (Vercel Functions, 선택): 코드 거의 그대로. 1~2시간. import 경로만 @/lib/ → ../lib/. Vercel Hobby 60s timeout 리스크.
  - B안 (localhost demo + v1.5에 백엔드 상용화): 작업 0. MVP mom test 10명만 Eugene 노트북에서. 외부 100명은 v1.5.
  - C안 (Next.js 별도 분리): sajutalk 검증된 패턴. 2~3시간. CORS 필요. monorepo 추가 project.
  - D안 (Expo SDK 53 upgrade): RN 0.74 → 0.76 + NativeWind 재설정 + node 22 검증. 3~4시간 + 회귀 리스크.
- **선택 이유**: (1) 작업량 최소 — 기존 코드 sed로 import 경로만 변환 + scripts/sync 자동화. (2) sajutalk 패턴 답습 가능 — Vercel functions는 표준. (3) Vercel Hobby 60s timeout은 정밀 진단(45~90초)에만 위험 — 발생 시 Pro $20/월 추가 결정. (4) prompts fs.readFileSync는 inline string으로 변경 (수동 sync 비용은 작음 — Eugene이 .md 편집 후 .ts에 복사).
- **영향 범위**: eduluck/api/ 9 파일 신규. eduluck/lib/prompts/*.ts inline. vercel.json rewrites /api 제외. dev (expo start)는 app/api/ 사용, prod (Vercel)는 api/ 사용.
- **되돌리는 방법**: api/ 디렉토리 삭제 + vercel.json rewrites 원복. lib/prompts/*.ts fs.readFileSync 복원. dev는 영향 없음.


## 2026-05-18 (재결정): 사주톡 만세력 보정 즉시 배포 (A안 채택, B안 번복)

- **선택**: A안 — 보정된 engine.ts를 사주톡 production에도 즉시 배포
- **대안 검토**:
  - B안 (직전 결정): 사주톡은 현 상태 유지, 학운에만 적용 — 테스트 데이터 일관성 우선
  - A안 (재결정): 양쪽 모두 보정 적용 — 정확도 우선, 통일된 데이터 기반
- **선택 이유**: (1) 영향 범위 작음 (절기 당일·1987-88 출생자 ~6%). (2) 10명 테스트가 부정확 데이터 위에서 진행되는 게 오히려 결과 해석에 노이즈. (3) 학운과 사주톡이 같은 engine.ts 사용 — fork 분기 시 유지보수 부담. (4) 검증 40/40 통과로 회귀 리스크 낮음.
- **영향 범위**: 사주톡 production 사주 결과 일부 변경 (절기 당일 출생자의 년주·월주, 1987-88 출생자의 시주). 다른 사용자는 영향 없음. 학운에서도 같은 코드 재사용.
- **되돌리는 방법**: `git revert` engine.ts 변경 커밋. solar-terms.ts, dst.ts 모듈은 import만 제거하면 무력화. lunar-typescript 의존성은 unused로 두거나 제거.

### 직전 (취소된) B안 결정 — 참고

- 2026-05-18 13:50 시점에 B안(사주톡 변경 없음) 결정했으나 같은 세션에서 사용자가 A로 번복.
- 번복 이유: 추가 검토 결과 정확도 향상 이득이 변경 비용보다 큼.


## 2026-05-05: prompt_checker 기본 보기 모드 — "결과만"으로 변경 (diff는 토글)

- **선택**: 어드민 결과 패널 기본 모드를 `current-only` (마크다운 렌더링)로. 기존 [좌우 비교] / [한 줄 diff]는 토글 버튼으로 유지. 마크다운은 `marked` CDN으로 클라이언트 렌더링.
- **대안 검토**:
  - 기존 default(좌우 비교): 모든 변경마다 좌우 분할 diff 표시 — LLM 변이성으로 빨강/초록이 도배되어 진짜 신호 식별이 어려움
  - 결과만 default + diff 토글 (선택): 일상 반복은 그냥 읽기, 큰 변경 후 회귀 체크할 때만 diff. 노이즈 제거
  - diff 완전 제거: 회귀 체크 케이스(섹션 삭제·톤 자체 변경)에서 여전히 유용 → 토글로 보존
- **선택 이유**: 사용자가 "어차피 같은 프롬프트도 매번 다른 결과가 나와서 diff 노이즈만 됨" 지적. LLM 출력은 비결정적이라 단어 1~2개 다듬는 미세 튜닝에선 진짜 변경 vs 변이성을 diff 색깔로 구분 불가능. 그냥 읽고 판단하는 게 빠름. 큰 구조 변경(섹션 추가/삭제, 톤 전환) 회귀 체크는 토글로 살림.
- **영향 범위**: `prompt_checker/scripts/view.ts` — `buildDiffHtml` → `buildViewContent` 리팩터, `ViewFormat` 타입 추가, `/api/diff`가 mode에 따라 text/plain (raw md) 또는 text/html (diff) 반환. HTML 측 `<script src=marked>` CDN, `.md-render` CSS, `[결과만]` 버튼 default. SSE 점 누적 버그도 같이 수정 (raw chunk forward).
- **되돌리는 방법**: `let diffMode = 'side-by-side'`로 기본값 복귀 + `[결과만]` 버튼 제거. 또는 git revert 이번 커밋.

---

## 2026-05-05: Vercel `outputFileTracingIncludes`로 prompts/*.md 명시 포함

- **선택**: `next.config.mjs`에 `experimental.outputFileTracingIncludes` 추가하여 `/api/**/*` 람다 번들에 `./prompts/**/*` 포함.
- **대안 검토**:
  - 정적 path 사용 (`fs.readFileSync('./prompts/interpret-daily.md', 'utf8')`): Next.js 정적 분석이 추적 가능. 단점: 프롬프트마다 별도 import 라인 필요, 동적 호출 불가
  - DB(Supabase)에 프롬프트 저장 + 매 요청 fetch: 가장 동적이지만 cold start latency + cache 관리 + 단일 소스(.md) 장점 상실
  - `outputFileTracingIncludes` 명시 (선택): 코드 변경 0, 함수형(매 호출 fs.readFileSync) 패턴 유지, prod·dev·prompt_checker 모두 같은 .md 사용
- **선택 이유**: Next.js 정적 분석이 `process.cwd()` + 동적 path를 추적 못 해 deploy 시 .md가 람다에서 누락 → ENOENT. 명시 포함이 가장 단순. Vercel deploy 후 `/api/interpret` HTTP 200으로 검증 완료.
- **영향 범위**: `sajutalk/next.config.mjs` (10줄 추가). 빌드 시 lambda 번들에 .md 포함, cold start 영향 거의 없음.
- **되돌리는 방법**: `next.config.mjs`에서 해당 블록 제거. 단, Vercel deploy에서 즉시 ENOENT 재발생.

---

## 2026-04-29: prompt_checker 어드민 UI 빌드 (이전 결정 번복)

- **선택**: 웹 어드민 페이지 빌드 (`view.ts`에 편집기 + SSE 실행 + promote 통합)
- **대안 검토**:
  - CLI 단독 (이전 결정): 터미널 + 브라우저 왔다갔다 — 사용자가 컨텍스트 스위치 비효율 지적
  - 어드민 UI 추가: 한 화면에서 편집 → 실행 → diff → 키퍼. 단, 이전 어드민 거절 시 우려한 sync drift는 .md 파일을 직접 수정하므로 발생 안 함 (단일 소스 유지)
- **선택 이유**: sync drift 우려는 별도 DB/state를 가진 어드민에 해당. 우리 어드민은 `sajutalk/prompts/*.md`를 직접 read/write하므로 단일 소스 유지. 인프라 (HTTP 서버·diff2html·promote)는 이미 `view.ts`에 있어 1.5~2시간 작업으로 통합 가능. 사용자 요청 명시적.
- **영향 범위**: `prompt_checker/scripts/view.ts` 전면 재작성 (~590줄). `lib/prompts/interpret.ts/qna.ts/summary.ts` 함수형 변환 (.md 핫리로드 지원 — 어드민 저장 즉시 다음 실행에 반영).
- **되돌리는 방법**: `view.ts`를 git revert로 이전 단순 뷰어 버전으로 복원 + interpret.ts/qna.ts/summary.ts 함수형을 상수형으로 재변환. CLI(`test.ts`, `promote.ts`)는 그대로 사용 가능.

---

## 2026-04-29: 시스템 프롬프트 함수형 변환 (모듈 상수 → 함수)

- **선택**: `INTERPRET_SYSTEM_DAILY/PREMIUM` 등 module-level 상수를 모두 `getXxx()` 함수로 변환. 매 호출마다 `fs.readFileSync` 재실행.
- **대안 검토**:
  - 모듈 상수 유지 + dev 서버 매번 재시작: 매 .md 수정마다 Ctrl+C → npm run dev 반복 — 어드민 UX 망가짐
  - Next.js HMR 의존: webpack은 fs.readFileSync 동적 path를 추적 안 함. 작동 보장 X
  - 함수형 + 매 호출 읽기 (선택): 단순함, 항상 최신 .md. dev에서 약간의 디스크 I/O 추가 (무시 수준). prod에서는 .md가 변하지 않으므로 동일 동작
- **선택 이유**: 어드민에서 저장 직후 실행이 의도대로 되려면 핫리로드 필수. Next.js HMR 우회보다 함수 호출이 명시적·안정적. 디스크 캐시 덕분에 성능 영향 극히 미미.
- **영향 범위**: `lib/prompts/interpret.ts` (DAILY/PREMIUM 함수화), `lib/prompts/qna.ts` (QNA_SYSTEM 상수 제거), `lib/prompts/summary.ts` (SUMMARY_SYSTEM 상수 제거 + getSummarySystem 신규), `app/api/summary/route.ts` (호출부 수정).
- **되돌리는 방법**: 상수형으로 되돌리되 prod 배포 전 .md를 빌드 시점에 inline (예: build script에서 .md → ts 생성). 또는 dev 서버 재시작 워크플로우로 회귀.

---

## 2026-04-29: view.ts에서 sajutalk dev 서버 자동 기동 (concurrently 대신 spawn)

- **선택**: `view.ts`가 직접 `child_process.spawn`으로 sajutalk dev 서버 기동. 이미 실행 중이면 재사용.
- **대안 검토**:
  - 사용자가 두 터미널 직접 관리 (이전): `cd sajutalk && npm run dev` + `cd prompt_checker && npm run view` 별도 — 사용자가 단일 명령 요청
  - `concurrently` 패키지 사용: 두 명령 병렬 실행. 단점: 새 의존성 (~50KB), wait-on 추가 필요 (또 다른 의존성)
  - `view.ts`에서 spawn (선택): 의존성 0. ready 폴링으로 Next.js 준비 후 어드민 시작. SIGINT 핸들러로 자식 정리
- **선택 이유**: 의존성 없이 60줄로 처리. 이미 실행 중인 dev 서버 자동 감지·재사용 (사용자가 별도 터미널에서 미리 띄워둔 케이스도 정상 동작). 종료 시 cascade kill로 좀비 프로세스 방지.
- **영향 범위**: `prompt_checker/scripts/view.ts` (~70줄 추가 — ensureSajutalkServer, shutdown 핸들러). README 갱신.
- **되돌리는 방법**: `ensureSajutalkServer()` 호출 제거하면 이전처럼 사용자가 별도 터미널 관리 필요. 또는 concurrently로 교체 (의존성 + wait-on 추가).

---

## 2026-04-29: 시스템 프롬프트를 .md 파일로 분리 (단일 소스)

- **선택**: `INTERPRET_SYSTEM_DAILY`, `INTERPRET_SYSTEM_PREMIUM`을 `sajutalk/prompts/*.md`로 분리, `lib/prompts/interpret.ts`는 `fs.readFileSync(process.cwd()/prompts/...)`로 읽음.
- **대안 검토**:
  - 코드 안 인라인 (기존): TS 문자열 리터럴. 수정마다 코드 PR, prompt caching 시 system 부분 안정성 ↓.
  - .md 파일 + import: webpack raw-loader 추가 필요. Next.js 빌드 설정 손대야 함.
  - .md 파일 + fs.readFileSync (선택): 모듈 로드 시 1회 읽음. Next.js 표준 동작. prompt_checker도 같은 .md 참조 가능.
- **선택 이유**: (1) 단일 소스 — prompt_checker가 dev 서버 통해 사용하므로 자연히 같은 .md 사용. (2) prompt caching의 prefix(system) 안정화 → 운영비 30~50% 절감 기대. (3) git diff가 곧 프롬프트 변경 이력 (PR 리뷰 = 거버넌스). (4) 따로 빌드 설정 변경 없음.
- **영향 범위**: `sajutalk/prompts/interpret-daily.md`, `interpret-premium.md` 신규. `lib/prompts/interpret.ts`에서 인라인 상수 200여 줄 제거.
- **되돌리는 방법**: `git revert 8593a65` 또는 .md 파일 내용을 다시 TS 문자열 리터럴로 인라인.

---

## 2026-04-29: prompt_checker를 sajutalk와 sibling 디렉토리로 분리

- **선택**: `four-pillars/prompt_checker/` (sajutalk와 같은 레벨). prompts/는 sajutalk 안에 유지.
- **대안 검토**:
  - 모두 sajutalk 안 (원안): scripts·fixtures·outputs까지 sajutalk/에 두면 앱 디렉토리가 테스트 인프라로 폐허.
  - 모두 prompt_checker로 (prompts 포함): 완전 분리되지만 Next.js Vercel 배포가 sajutalk/만 빌드해서 prompts/가 누락. cross-dir 경로 처리 복잡.
  - 부분 분리 (선택): prompts는 prod 런타임용이라 sajutalk에 유지. 테스트 인프라(fixtures/outputs/scripts/뷰어)만 sibling 분리.
- **선택 이유**: 앱 배포 안전성 (prompts가 sajutalk와 함께 deploy됨) + 테스트 인프라 격리 (앱 디렉토리 깨끗) + 단일 소스 (prompt_checker가 dev 서버 HTTP API를 통해 동일 prompts 사용).
- **영향 범위**: `prompt_checker/` 신규 디렉토리 (자체 package.json, scripts/, fixtures/, outputs/, README.md).
- **되돌리는 방법**: `prompt_checker/` 폴더 삭제 또는 git revert.

---

## 2026-04-29: prompt_checker가 dev 서버 HTTP API로 동작 (TS 직접 import 안 함)

- **선택**: `prompt_checker/scripts/test.ts`가 `localhost:3002/api/manse` + `/api/interpret` 호출. sajutalk의 `buildInterpretPrompt`나 manse 엔진을 직접 import 안 함.
- **대안 검토**:
  - sajutalk TS 직접 import: cross-dir tsx 설정 + `@/` 경로 aliases 처리 + interpret.ts의 cwd 의존 fs.readFileSync 동작 보장 등 복잡. drift 위험.
  - manse 엔진을 prompt_checker가 직접 사용 + buildInterpretPrompt 로직 재구현: drift 위험 (sajutalk 변경 시 prompt_checker 따로 수정 필요).
  - HTTP API 사용 (선택): 실제 prod 코드를 거치므로 drift 0. 단점은 dev 서버 띄워야 함.
- **선택 이유**: 단일 소스 보장 + 구현 단순. dev 서버 실행은 어차피 평소 작업에 필요한 상태.
- **영향 범위**: `prompt_checker/scripts/test.ts` (HTTP fetch 사용). 친절한 에러 메시지로 dev 서버 미실행 시 안내.
- **되돌리는 방법**: 직접 import 방식으로 전환 — tsx 설정 + paths 설정 + interpret.ts의 path resolution 변경 필요.

---

## 2026-04-29: 화면 최대 폭(max-width) 기준 결정

- **선택**: 데스크톱 640px / 모바일 100% (Option A)
- **대안 검토**:
  - 375px 전체 통일 — 모바일 느낌 일관적이나 데스크톱에서 너무 좁음
  - 640px 데스크톱 + 100% 모바일 — 읽기 편한 본문 폭, 반응형 대응
- **선택 이유**: 375px가 데스크톱에서 지나치게 좁다는 피드백 반영, 웹 조사 결과 640px이 본문 중심 UI에 적합
- **영향 범위**: `page.tsx`, `result/page.tsx`, `chat/page.tsx` 세 화면의 max-width
- **되돌리는 방법**: 세 파일의 max-width 값을 변경하면 됨

---

## 2026-04-29: 프롬프트 테스트 방법 결정

- **선택**: CLI 스크립트(C) + Anthropic Workbench(B) 조합
- **대안 검토**:
  - (A) 어드민 UI 구축 — 풀스택 작업 필요, 유지보수 부담
  - (B) Anthropic Workbench 단독 — 빠르게 시작 가능하나 자동화·버전 관리 어려움
  - (C) CLI 스크립트(`test-prompt.ts`) — 코드로 관리 가능, CI 연동 용이
- **선택 이유**: 어드민 UI는 과잉 투자, Workbench로 빠른 실험 + CLI로 반복·자동화 커버
- **영향 범위**: 아직 구현 전 — `test-prompt.ts` 스크립트 작성 예정
- **되돌리는 방법**: 스크립트 삭제 후 어드민 UI로 전환 가능 (비가역적 요소 없음)


## 2026-04-29: 전체 화면 폭 max-width 640px 통일

- **선택**: 데스크톱 max-width 640px, 모바일 width 100% (Option A)
- **대안 검토**:
  - 375px 고정: 모바일 완벽하지만 데스크톱에서 너무 좁다는 피드백
  - 640px + 모바일 100% (Option A): 모바일 채팅앱 비율 유지, 데스크톱에서도 적절한 폭
  - 반응형 breakpoint (Option B): 복잡도 증가 대비 현재 단계에서 불필요
- **선택 이유**: 사용자가 375px 데스크톱 화면을 보고 "너무 좁다"고 직접 판단. 웹 조사 결과 모바일 퍼스트 앱의 데스크톱 max-width 640px이 일반적 패턴.
- **영향 범위**: `app/page.tsx`, `app/result/page.tsx`, `app/chat/page.tsx` — 세 화면 모두 max-width 640px 적용
- **되돌리는 방법**: 각 페이지의 maxWidth 값을 변경하면 됨

## 2026-04-29: 프롬프트 테스트 방법 — CLI 스크립트 + Anthropic Workbench

- **선택**: CLI 스크립트(`test-prompt.ts`) + Anthropic Workbench 조합
- **대안 검토**:
  - 어드민 UI (Option A): 브라우저에서 프롬프트 편집·테스트 가능하나 별도 화면 개발 필요, MVP 범위 초과
  - Anthropic Workbench (Option B): 프롬프트 반복 테스트에 최적화, 즉시 사용 가능하나 실제 만세력 데이터 주입이 번거로움
  - CLI 스크립트 (Option C): 실제 만세력 데이터로 프롬프트 호출·결과 파일 저장 자동화, 빌드 비용 최소
- **선택 이유**: CLI 스크립트로 실제 데이터 기반 테스트 자동화 + Workbench로 프롬프트 빠른 반복. 어드민 UI는 10명 테스트 이후 피드백 반영 단계에서 재검토.
- **영향 범위**: 신규 `test-prompt.ts` 파일 (미작성), 기존 코드 변경 없음
- **되돌리는 방법**: 스크립트 파일 삭제

---

## 2026-04-29: chat 자동 스크롤 완전 제거 (사용자 수동 스크롤)

- **선택**: `useEffect`로 메시지/스트리밍 변경 시마다 `scrollIntoView` 호출하던 로직 통째로 제거. 이제 사용자가 직접 마우스/터치로 스크롤.
- **대안 검토**:
  - 항상 하단 자동 스크롤 유지 (현 상태): 사용자가 메시지를 쓰거나 위쪽 내용을 읽으려 할 때 강제로 아래로 끌려가는 UX 문제 발생
  - 스마트 스크롤 부활 (2026-04-25 제거됨): 임계값 튜닝이 어렵고 기기·화면 크기마다 다르게 작동
  - 자동 스크롤 완전 제거: 단순함. 사용자가 능동적으로 따라가야 하지만 현재 위치에 포커스가 유지됨
- **선택 이유**: 사용자가 직접 "메세지 쓰면 자꾸 아래로 포커스가 간다"고 지적. 단순한 동작이 예측 가능하고 사용자 의도를 존중. 스트리밍 텍스트는 자연스럽게 화면 하단을 채우므로 첫 진입 시점엔 별 문제 없음.
- **영향 범위**: `app/chat/page.tsx` — `bottomRef` 선언, scrollIntoView useEffect, sentinel div 모두 제거. 2026-04-25 결정("항상 하단 자동 스크롤") 무효화.
- **되돌리는 방법**: `useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText])` + sentinel div 복원. 또는 git revert 이번 커밋.

---

(세션 요약에 대안 비교 후 의사결정한 사항이 없습니다. "reality → premium 톤 교체, 스마트 스크롤 제거"는 결정 사항으로 언급되었으나, 대안 검토 과정이 기록되지 않았습니다.)


## 2026-04-25: reality 톤 제거 → premium 톤 신설

- **선택**: `ToneType = 'daily' | 'premium'` — reality 완전 삭제, premium(12섹션 리포트형) 신설
- **대안 검토**:
  - reality 유지: 생활 상담형과 출력 차이가 체감되지 않는다는 사용자 피드백. 유지 시 UI 버튼 2개가 사실상 동일한 결과물을 낼 위험.
  - premium 신설: 마크다운 테이블·등급(A/B/C/D)·인생 구간 역할 레이블·연도별 진단표·체크리스트 등 구조화된 리포트 형태로 확실한 차별화 가능.
- **선택 이유**: 사용자가 두 톤의 차이가 없다고 직접 판단. premium은 포맷 자체(표·등급·체크리스트)가 다르므로 체감 차이가 명확함.
- **영향 범위**: `local-store.ts`(ToneType), `hook.ts`(HOOK_SYSTEM_PREMIUM), `interpret.ts`(INTERPRET_SYSTEM_PREMIUM 신설·REALITY 제거), `result/page.tsx`(버튼), `chat/page.tsx`(TONE_LABEL·훅 조건)
- **되돌리는 방법**: git revert `58cb93e` (feat: add premium tone)

## 2026-04-25: 스마트 스크롤 제거

- **선택**: 항상 하단 자동 스크롤 (스마트 스크롤 로직 전체 제거)
- **대안 검토**:
  - 스마트 스크롤 유지·임계값 조정: 60px → 더 큰 값으로 늘려 조금 올려도 멈추지 않게. 하지만 임계값 튜닝이 기기·화면 크기마다 다르게 작동할 수 있음.
  - 완전 제거: 구현 단순화. 스트리밍 중 내용을 보려면 스크롤 후 직접 올라가야 하지만, 사용 패턴상 스트리밍이 끝난 후 읽는 경우가 대부분.
- **선택 이유**: 사용자가 "구현이 실패했다"고 직접 판단. 복잡한 UX보다 단순하고 예측 가능한 동작이 우선.
- **영향 범위**: `app/chat/page.tsx` — `userScrolledUp` ref, 스크롤 이벤트 리스너, 조건부 스크롤 로직 제거
- **되돌리는 방법**: git revert `78018f5` 후 스마트 스크롤 useEffect 재구현

---

## 2026-04-25: 해석 스타일 톤 4개 → 2개 축소 (역술가형 + 전략가형)

- **선택**: `'yeoksulga' | 'strategist'` 2개 유지, 나머지(과학형·예시형·심리상담가형) 제거
- **대안 검토**:
  - 4개 유지: 구현된 상태로 두되 E2E 검증 — 각 톤별 출력 품질 보장이 어렵고 UI 복잡도 높음
  - 2개로 축소: 역술가형은 완성된 9섹션 구조 활용, 전략가형은 placeholder → 별도 세션에서 구체화
- **선택 이유**: 역술가형 캘리브레이션 훅 + 9섹션 리딩이 핵심. 다른 3개 톤은 아직 이에 맞는 시스템 프롬프트 개편 없이 구버전이므로 노출 제거가 맞음. 전략가형은 향후 점수 엔진·5단계 평가 구조로 차별화 예정.
- **영향 범위**: `lib/session/local-store.ts`(ToneType), `lib/prompts/interpret.ts`, `lib/prompts/hook.ts`, `app/result/page.tsx`, `app/chat/page.tsx`
- **되돌리는 방법**: ToneType에 'science' | 'example' | 'counselor' 재추가 + 각 시스템 프롬프트 복원 (git log `2c059de` 이전)

## 2026-04-25: 캘리브레이션 훅 — 역술가 톤만 먼저 구현

- **선택**: 역술가 톤 1개만 구현 후 E2E 검증, 나머지 3개는 결과 보고 결정
- **대안 검토**:
  - 4개 톤 전체 동시 적용: 구현량 많고 각 톤별 훅 품질 검증 비용 높음
  - 역술가만 먼저: 훅 UX 자체가 맞는지 검증 후 확장 — 리스크 최소화
- **선택 이유**: 훅 플로우(B_HOOK → C_CALIBRATING → B)가 처음 도입되는 UX 변경. 1개 톤으로 먼저 사람 검증 후 나머지 적용.
- **영향 범위**: chat-machine.ts, chat/page.tsx, api/hook/route.ts, lib/prompts/hook.ts
- **되돌리는 방법**: getHookSystem이 null 반환 시 B_HOOK 진입 안 함 — 톤별 온/오프 구조 유지

## 2026-04-25: 캘리브레이션 버튼 — 3개 → 2개(예/아니오)

- **선택**: 예/아니오 2개 버튼
- **대안 검토**:
  - 3개 (예/아니오/다른 형태였다): 원문 AI 제안. "아니오가 실패가 아니라 데이터가 된다"는 논리
  - 2개 (예/아니오): 사용자 판단 — 단순하고 즉각적
- **선택 이유**: 사용자가 직접 2개로 결정. 세 번째 버튼은 UX 복잡도 대비 가치 불명확.
- **영향 범위**: app/chat/page.tsx — C_CALIBRATING 렌더링
- **되돌리는 방법**: handleCalibrate 타입에 'other' 추가 + 버튼 1개 추가

---

## 2026-04-25: tone 전달 방식 선택

- **선택**: localStorage
- **대안 검토**: (세션 요약에 구체적인 대안 비교 내용 없음 — 별도 기록 필요)
- **선택 이유**: (세션 요약에 명시되지 않음)
- **영향 범위**: `.harness` 관련 파일 3개, tone 전달 로직
- **되돌리는 방법**: (세션 요약에 명시되지 않음)

---

> ⚠️ **주의**: 세션 요약에 대안 비교 내용이 없어 결정 제목과 선택만 확인 가능합니다.
> decision.md에 실제 검토한 대안(예: URL 파라미터, Context API, 서버 상태 등)과 선택 이유가 기록되어 있다면, 그 내용을 보완해서 다시 요청해주세요.


## 2026-04-24: 화면 4 상태 머신 구현 방식

- **선택**: `useReducer` + 순수 함수 `chatReducer` (lib/state/chat-machine.ts)
- **대안 검토**:
  - XState: 타입 안전하고 시각화 가능하나 의존성 추가, 학습 곡선, MVP 오버엔지니어링
  - Zustand: 전역 상태 관리에 적합하나 화면 4 로컬 상태에는 과도함
  - useReducer: Next.js 내장, 의존성 없음, 순수 함수로 테스트 용이
- **선택 이유**: 상태 전이가 명확한 6상태(A~F) 로컬 머신 → useReducer가 충분. XState는 §8 재량 범위 내 결정이므로 의존성 최소화 우선.
- **영향 범위**: app/chat/page.tsx, lib/state/chat-machine.ts
- **되돌리는 방법**: chat-machine.ts의 chatReducer를 XState machine으로 교체 (인터페이스 동일하게 유지하면 page.tsx 수정 최소화)

## 2026-04-24: 해석 톤 선택을 URL 파라미터가 아닌 localStorage(conversation.tone)로 전달

- **선택**: `saveConversation({ tone })` → localStorage → `loadConversation().tone` 읽기
- **대안 검토**:
  - URL searchParams (`/chat?tone=science`): 공유 가능하고 명시적이나 기존 라우팅 패턴과 다르고 result→chat 전환에 router.push 수정 필요
  - URL searchParams: SSR에서 `useSearchParams` Suspense 경계 필요 — 추가 래퍼 컴포넌트 발생
  - localStorage (conversation): 기존 concern·pattern 전달 방식과 완전히 동일 — 일관성 유지
- **선택 이유**: 기존 `saveConversation`/`loadConversation` 패턴이 이미 화면 간 상태 전달의 유일 경로로 정해져 있음. 톤도 "대화 설정"이므로 같은 버킷에 넣는 것이 자연스러움.
- **영향 범위**: lib/session/local-store.ts, app/result/page.tsx, app/chat/page.tsx
- **되돌리는 방법**: URL searchParams 방식으로 전환 시 `useSearchParams` 훅 추가 + Suspense boundary 래핑 필요

## 2026-04-24: 사주 AI 톤앤매너 전환 (역술가 → 과학자+심리상담가)

- **선택**: 과학자+심리상담가 톤 — 확률 언어("약 7할"), 결론 먼저 → 근거 → 시나리오, 불확실성 인정 필수
- **대안 검토**:
  - 기존 역술가 톤(친근한 TV 스타일): 타겟 여성층에게 친숙하나 차별화 없고 "누구에게나 맞는 말"이 되기 쉬움
  - 학술적 논문 톤: 엄밀하나 일반 사용자에게 딱딱하고 이탈 유발
  - 과학자+심리상담가 복합 톤: 논리·확률 언어로 신뢰를 주면서 공감 언어로 거리감 조절
- **선택 이유**: 사용자 피드백 — "역술가들 다 저렇게 말해서 재미없다. 특징이 있어야 한다." 차별화를 위해 분석적 언어와 확률 표현이 필요.
- **영향 범위**: lib/prompts/interpret.ts, qna.ts, summary.ts — SYSTEM 프롬프트 전면 개편
- **되돌리는 방법**: git log에서 이전 INTERPRET_SYSTEM 텍스트 복원 (커밋 abdb548 이전)

## 2026-04-24: 합충형파해+지장간+오늘날짜+톤변경 단일 run으로 통합

- **선택**: 4개 작업(합충형파해 구현, 지장간 구현, 오늘날짜 주입, 톤 변경)을 단일 run(`manse-v2-hapchunh-sciencetone`)으로 통합 실행
- **대안 검토**:
  - 단계별 별도 run: 각 작업을 독립 run으로 분리 → 검증 포인트가 명확하나 context 전환 비용 높음
  - 톤 변경만 먼저 → 합충 별도: 첫 제안이었으나 사용자가 "이번 런 하고 내가 검증할게 없다"며 거부
  - 단일 run 통합: 4개 작업이 모두 같은 프롬프트 레이어를 건드리므로 한 번에 수정 후 사용자 1회 E2E 검증이 효율적
- **선택 이유**: 검증 주체가 사용자(E2E) 1번이면 충분 — 프롬프트 레이어 수정은 독립적이므로 순차 검증 대신 일괄 구현이 맞음.
- **영향 범위**: lib/manse/jijanggan.ts(신규), hapchunh.ts(신규), engine.ts, lib/prompts/ 3개 파일
- **되돌리는 방법**: 커밋 abdb548 revert

## 2026-04-24: shadcn 패키지 Tailwind v4 호환성 처리

- **선택**: globals.css에서 `@import "shadcn/tailwind.css"` 및 `@import "tw-animate-css"` 제거, tailwind.config.ts에 색상 토큰 수동 추가
- **대안 검토**:
  - Tailwind v4로 업그레이드: shadcn v4.4.0 패키지와 완전 호환되나 Next.js 14.2.35 + Tailwind v3 프로젝트 전체 마이그레이션 필요 (리스크 높음)
  - shadcn 패키지 다운그레이드: v3 호환 버전 불분명, 직접 설치한 컴포넌트(button, input 등)는 base-ui 기반으로 이미 커스텀됨
  - import 제거 + 색상 토큰 수동 추가: 기존 컴포넌트 동작 유지, CSS 변수 기반 색상 그대로 사용 가능
- **선택 이유**: base-ui 기반 shadcn 컴포넌트들은 CSS 변수만 참조하므로 `@theme` 구문 없어도 동작. 가장 적은 변경으로 빌드 오류 해결.
- **영향 범위**: app/globals.css, tailwind.config.ts
- **되돌리는 방법**: Tailwind v4 마이그레이션 시 globals.css import 복원하고 tailwind.config.ts의 extend.colors 섹션 제거
