# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-04-24 20:24
## 마지막 업데이트: 2026-04-24 20:24
## 현재 모드: bypassPermissions

### 현재 집중

- 사주 해석 품질 개선 — 합충형파해 구현 vs 프롬프트 수정 우선순위 결정 대기

### 이어서 할 것

1. 합충형파해 구현 vs 프롬프트 수정 중 우선순위 결정 (사람 판단 필요)
2. 결정에 따라 프롬프트 수정 또는 lib/manse/clashes.ts 구현 착수
3. 미커밋 구현 파일 git add/commit/push

### 막힌 것

- 합충형파해 구현 vs 프롬프트 수정 중 어느 것을 먼저 할지 미결 (사람 판단 대기)
- Supabase credentials 미입력: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  → /api/session만 영향 (나머지 API 라우트는 동작 확인됨)

### 사람 판단 필요

- 합충형파해 구현 vs 프롬프트 수정 우선순위 결정
- localhost:3002 E2E 수동 품질 확인 (해석 직접 읽고 품질 판단)
- Supabase 프로젝트 생성 및 credentials 제공 (사용자 직접)
- Vercel 배포 직전 승인 (§9 [트리거 4] — 첫 공개 배포 전 정지)

### 백로그 요약

- 대기 중: 1개
- 최근 추가: 2026-04-24 — Supabase 연동 및 DB 스키마 migration

### 진행 상황

- [x] GitHub repo `four-pillars` 생성
- [x] docs/ 6개 파일 첫 커밋·푸시
- [x] harness 초기화 (CLAUDE.md, settings.json, profiles 4개, .harness/ 템플릿, .gitignore)
- [x] harness-doctor 전항목 정상 (hooks 8/8, commands 5/5, api_key, telegram, launchd 6/6)
- [x] CONTEXT.md 초안 작성 (docs/ A-0~B 기반)
- [x] [1~3/20] Next.js 14 앱(`sajutalk`) 생성, shadcn 초기화, 컴포넌트 설치
- [x] [7/20] `@fullstackfamily/manseryeok` 설치·래핑 (lib/manse/engine.ts)
- [x] [8/20] 만세력 Playwright 검증 10/10 통과 (verify.spec.ts)
- [x] [9/20] lib/prompts/ — interpret, qna, summary, classify
- [x] [10/20] lib/state/chat-machine.ts — 상태 머신 A~F
- [x] [11/20] API routes 6개 스텁 — session, manse, classify, interpret, qna, summary
- [x] [12~16/20] 화면 1~5 구현 (app/page.tsx, concern, pattern, chat)
- [x] 개발 서버 빌드 오류 수정 (Tailwind v3/v4 호환성, SSR localStorage, calculateSaju 시그니처)
- [x] /api/manse, /api/classify, /api/interpret 동작 확인
- [x] 화면 1 양력/음력 선택 추가 (lunarToSolar 변환, 윤달 체크박스)
- [x] 대운·세운·월운 LuckCycleTable UI 추가 (result 페이지, 우측=현재, 좌측=미래)
- [x] lib/manse/luck-cycles.ts — 대운·세운·월운 계산 모듈
- [x] lib/manse/shensha.ts — 신살 19종 계산 (초기 8종 → 19종 확장)
- [x] lib/manse/yongsin.ts — 억부용신 근사 계산
- [x] lib/prompts/interpret.ts 전면 개편 (5구획 40문장+, 전체 만세력 주입)
- [x] app/api/interpret/route.ts — max_tokens 4096, fullManse 파라미터
- [x] 40문장+ 스트리밍 개발 서버 수신 확인 (~50초)
- [x] getElementStyle 인라인 스타일 수정 (Tailwind 동적 클래스 색상 미적용 문제 해결)
- [x] 월주 십신 비견 표시 누락 버그 수정
- [x] 대운 49세 癸未 천간 십신 오류 수정 (hanja 기준 역변환 테이블로 방어)
- [x] 일주 십신 하드코딩 제거 (i===1 제거 → 비견/비견 정상 표시)
- [x] 첫 화면 자동 리다이렉트 제거 (sessionCount 기반 useEffect 삭제)
- [x] 사주 그리드 한자(작게)+한글(크게) 병기
- [x] 신살·길성 섹션 추가 (건록 포함, 길성=녹색/살=빨간색)
- [x] 채팅 프롬프트 6섹션 구조 전환 (성격/적성/운세/주의/재물/건강 + 나이대별 예시)
- [x] 채팅 답변 잘림 수정 (max_tokens 1024→3072)
- [x] react-markdown + @tailwindcss/typography 설치 (마크다운 렌더링)
- [ ] 합충형파해 구현 vs 프롬프트 수정 우선순위 결정 및 실행
- [ ] [4~6/20] .env.local 작성 + Supabase 연동 + DB migration
- [ ] 미커밋 구현 파일 git commit/push
- [ ] [17/20] 수동 E2E localhost 확인 (localhost:3002)
- [ ] [18/20] Vercel 배포 (§9 [트리거 4] 발동 예정)
- [ ] [19/20] production E2E 확인
- [ ] [20/20] 완료 보고 생성
- [ ] 10명 지인 테스트