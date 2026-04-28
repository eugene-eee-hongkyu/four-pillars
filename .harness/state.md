# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-04-28 20:30
## 마지막 업데이트: 2026-04-28 20:30
## 현재 모드: bypassPermissions

### 현재 집중

- 대화·결과 화면 dark 디자인 구현 완료 — Phase 3 Supabase 연동 대기

### 이어서 할 것

1. Phase 3: Supabase credentials 입력 → DB 마이그레이션
2. Vercel 배포 직전 승인

### 막힌 것

- Supabase credentials 미입력 → /api/session만 영향 (나머지 API 정상)

### 사람 판단 필요

- Vercel 배포 직전 승인 (Phase 3 진입 시)

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
- [x] 해석 스타일 톤 2개 — daily(생활 상담형)·premium(프리미엄 리포트형) (result 2버튼 + chat 헤더 뱃지)
- [x] tone 전달 방식 localStorage 채택 결정
- [x] /docs/internal-process.md 작성 — 내부 계산·AI 호출 시점·프롬프트/데이터 구성 방식 명세화
- [x] 역술가 캘리브레이션 훅 — B_HOOK·C_CALIBRATING 상태 + /api/hook + CalibrationContext 주입
- [x] 화면 1 테스트 샘플 데이터 프리필 (이홍규·남성·1976/01/03·23:00)
- [x] INTERPRET_SYSTEM_YEOKSULGA 9섹션 개편 (calibration-aware [왜 그런 일이 일어났는가])
- [x] 캘리브레이션 상세 입력 — 예/아니오/다른형태 3버튼, C_CALIBRATING_DETAIL·C_CALIBRATING_NO 상태 구현
- [x] lib/manse/score.ts 신규 — calcScores() 결정론 점수 엔진 (십신 가중치·합충 패널티·대운/세운 보너스)
- [x] lib/manse/engine.ts — scores: ScoreResult ManseResult에 통합
- [x] INTERPRET_SYSTEM_STRATEGIST 12섹션 시스템 프롬프트 + 점수 주입 블록 추가
- [x] docs/refs/sajutalk_final_style_guide.md 생성
- [x] next build 대신 tsc --noEmit 사용 규칙 수립 (dev server 청크 해시 충돌 방지)
- [x] B_ACK 상태 신규 — 캘리브레이션 후 LLM 없이 템플릿 확인 메시지 → 0.8초 후 B 자동 전환
- [x] /api/interpret max_tokens 4096 → 8192 (9섹션 중간 절단 수정)
- [x] docs/03_A-2_프로세스를_화면으로_사주톡.md — 코드 역산 A-2 문서 (라우트 5개, 상태 14개)
- [x] reality 톤 제거 → premium 톤 신설 (12섹션 리포트형, HOOK_SYSTEM_PREMIUM)
- [x] remark-gfm 설치 — 마크다운 테이블 렌더링 정상화
- [x] 스마트 스크롤 제거 — 항상 하단 자동 스크롤
- [x] docs/03_A-2_프로세스를_화면으로_사주톡_v3.md 신규 작성 (섹션 0~6 완성, 코드 역산 기준)
- [x] docs/03_A-2_프로세스를_화면으로_사주톡_v3.md 0-b 섹션에 AI 프롬프트명 병기
- [x] docs/03_A-2_프로세스를_화면으로_사주톡_v2.md 삭제 (v3로 대체)
- [x] app/result/page.tsx — dawn-mood dark 디자인 (CharBox, ElementBar, LuckTable, 끝 문구)
- [x] app/chat/page.tsx — 5 버블 변형 + 페이즈 구분선 + 다크 입력 독 + DONE 상태
- [x] layout.tsx — Cormorant Garamond, IBM Plex Sans KR, Noto Serif KR, Pretendard 폰트
- [x] [17/20] 수동 E2E localhost 확인 (chat/result 화면 스크린샷 검증 완료)
- [ ] [4~6/20] .env.local 작성 + Supabase 연동 + DB migration
- [ ] [18/20] Vercel 배포 (§9 [트리거 4] 발동 예정)
- [ ] [19/20] production E2E 확인
- [ ] [20/20] 완료 보고 생성
- [ ] 10명 지인 테스트
