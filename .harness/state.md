# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-05-18 14:24
## 마지막 업데이트: 2026-05-18 14:24
## 현재 모드: bypassPermissions

### 현재 집중

- 사주톡 만세력 정밀 보정 production 배포 완료 → 학운(eduluck) 피벗 기획 도착 대기

### 이어서 할 것

1. 학운 기획서(claude.ai 작성) 도착 → `eduluck/` 디렉토리 + A-0~A-2 문서 작성
2. 학운 빌드 진입 (사주톡 인프라·보정된 manse 엔진 재사용)
3. 사주톡 10명 지인 테스트 계속 진행 (보정된 만세력 위에서)

### 막힌 것

- 없음

### 사람 판단 필요

- 학운 기획 도착 시 사주톡과 코드 공유 방식 결정 (npm 패키지화 vs 디렉토리 sibling)

### 백로그 요약

- 대기 중: 3개
- 최근 추가: 2026-05-06 — 10명 지인 테스트 및 v2 검증

### 진행 상황

- [x] GitHub repo `four-pillars` 생성
- [x] docs/ 6개 파일 첫 커밋·푸시
- [x] harness 초기화 (CLAUDE.md, settings.json, profiles 4개, .harness/ 템플릿, .gitignore)
- [x] CONTEXT.md 초안 작성
- [x] [1~3/20] Next.js 14 앱(`sajutalk`) 생성, shadcn 초기화, 컴포넌트 설치
- [x] [7/20] `@fullstackfamily/manseryeok` 설치·래핑 (lib/manse/engine.ts)
- [x] [8/20] 만세력 Playwright 검증 10/10 통과
- [x] [9/20] lib/prompts/ — interpret, qna, summary, classify
- [x] [10/20] lib/state/chat-machine.ts — 상태 머신 A~F
- [x] [11/20] API routes 6개 스텁
- [x] [12~16/20] 화면 1~5 구현
- [x] 개발 서버 빌드 오류 수정 전체
- [x] 화면 1 양력/음력 선택 추가
- [x] 대운·세운·월운 LuckCycleTable UI + luck-cycles.ts
- [x] lib/manse/shensha.ts — 신살 19종
- [x] lib/manse/yongsin.ts — 억부용신 근사
- [x] lib/manse/jijanggan.ts — 지장간 12지지
- [x] lib/manse/hapchunh.ts — 합충형파해 (천간합·지지합·충·형·파·해·공망)
- [x] lib/prompts/interpret.ts — 9섹션 캘리브레이션 인식 구조 + 오늘날짜·합충·지장간 주입
- [x] lib/prompts/qna.ts — 동일 톤 동기화 + fullManse 주입
- [x] lib/prompts/summary.ts — 톤 맞춤 + 오늘날짜 주입
- [x] app/api/qna/route.ts — max_tokens 4096, fullManse 파라미터
- [x] react-markdown + @tailwindcss/typography (마크다운 렌더링)
- [x] getElementStyle 인라인 스타일 수정
- [x] 해석 스타일 톤 2개 — daily(생활 상담형)·premium(프리미엄 리포트형)
- [x] tone 전달 방식 localStorage 채택 결정
- [x] /docs/internal-process.md 작성
- [x] 역술가 캘리브레이션 훅 — B_HOOK·C_CALIBRATING 상태 + /api/hook + CalibrationContext 주입
- [x] 캘리브레이션 상세 입력 — 예/아니오/다른형태 3버튼
- [x] lib/manse/score.ts — calcScores() 결정론 점수 엔진
- [x] B_ACK 상태 신규 — 캘리브레이션 후 템플릿 확인 메시지
- [x] /api/interpret max_tokens 8192
- [x] reality 톤 제거 → premium 톤 신설
- [x] remark-gfm 설치 — 마크다운 테이블 렌더링
- [x] app/page.tsx, result/page.tsx, chat/page.tsx — dawn-mood dark 디자인
- [x] chat 자동 스크롤 완전 제거
- [x] [17/20] 수동 E2E localhost 확인 완료
- [x] 전체 화면 폭 max-width 640px 통일
- [x] 프롬프트 테스트 방법 결정: CLI 스크립트 + Anthropic Workbench
- [x] sajutalk/prompts/interpret-daily.md, interpret-premium.md — .md 단일 소스 분리
- [x] prompt_checker/ — fixtures × prompts 매트릭스 러너 + diff2html 웹뷰어 (커밋 8593a65)
- [x] 시스템 프롬프트 함수형 변환 (interpret/qna/summary) — .md 핫리로드 지원
- [x] prompt_checker 웹 어드민 — 편집/저장/실행/SSE/promote 통합 (커밋 762abef)
- [x] view.ts에서 sajutalk dev 서버 자동 spawn — `npm run view` 한 줄로 모두 기동
- [x] [4~6/20] .env.local 작성 + Supabase 연동 + DB migration (project: dnnibzpxswbqauzvuyjh, Seoul)
- [x] [18/20] Vercel 배포 — https://four-pillars-two.vercel.app/
- [x] [19/20] production E2E 확인
- [x] [20/20] 완료 보고 v1 (`docs/06_완료보고_사주톡_v1.md`, 커밋 6fab25f)
- [x] prompt_checker SSE 점 누적 버그 수정 + 자동 줄바꿈 + "결과만" 기본 모드
- [x] 만세력 4대 변수 검증 (자시/진태양시/DST/절기) — 2개 결함 발견
- [x] **lib/manse/dst.ts** — 한국 DST 자동 보정 (16/16 통과)
- [x] **lib/manse/solar-terms.ts** — 절기 분 단위 KST 기반 년·월주 자체 계산 (12/12)
- [x] **engine.ts** wrapper 통합 (12/12) + verify.spec.ts 갱신
- [x] prompt_checker 검증 스크립트 4종 (validate-dst/solar-terms/engine/manse)
- [x] 사주톡 production 즉시 배포 (B → A 번복, 커밋 b1f6eaa + 69efdf4)
- [x] production 보정 반영 검증 (2024-02-04 17:00 → 계묘 을축, 1988-08-15 DST 적용)
- [ ] 학운(eduluck) 프로젝트 셋업 — 기획 도착 대기
- [ ] 10명 지인 테스트 (보정된 만세력 위에서 진행 중)
- [ ] v2 완료 보고 (10명 결과 통합 후)
