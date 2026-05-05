# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-04-30 08:50
## 마지막 업데이트: 2026-04-29 22:16
## 현재 모드: bypassPermissions

### 현재 집중

- production 배포 완료 (https://four-pillars-two.vercel.app/) — 10명 지인 테스트 시작 가능

### 이어서 할 것

1. 10명 지인 테스트 (CONTEXT.md 검증 축 — 긴 해석 후 3번 질문 + 정리까지 완주)
2. (선택) qna/summary/hook .md 분리 + 어드민에 자동 등장
3. 완료 보고 생성

### 막힌 것

- 없음

### 사람 판단 필요

- 없음

### 백로그 요약

- 대기 중: 4개
- 최근 추가: 2026-04-25 — daily 톤 회귀 테스트

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
- [x] 전체 화면 폭 max-width 640px 통일 (page.tsx, result/page.tsx, chat/page.tsx)
- [x] 프롬프트 테스트 방법 결정: CLI 스크립트 + Anthropic Workbench
- [x] sajutalk/prompts/interpret-daily.md, interpret-premium.md — .md 단일 소스 분리
- [x] prompt_checker/ — fixtures × prompts 매트릭스 러너 + diff2html 웹뷰어 (커밋 8593a65)
- [x] 시스템 프롬프트 함수형 변환 (interpret/qna/summary) — .md 핫리로드 지원
- [x] prompt_checker 웹 어드민 — 편집/저장/실행/SSE/promote 통합 (커밋 762abef)
- [x] view.ts에서 sajutalk dev 서버 자동 spawn — `npm run view` 한 줄로 모두 기동
- [x] [4~6/20] .env.local 작성 + Supabase 연동 + DB migration (project: dnnibzpxswbqauzvuyjh, Seoul)
- [x] [18/20] Vercel 배포 — https://four-pillars-two.vercel.app/
- [x] [19/20] production E2E 확인
- [ ] [20/20] 완료 보고 생성
- [ ] 10명 지인 테스트