# 사주톡 MVP 빌드 계획

> B §5 빌드 순서 20단계 기반. append-only 실행 로그는 progress.md에.

---

## 전제 조건 (§1 체크리스트)

| 항목 | 상태 | 메모 |
|---|---|---|
| Anthropic API key (ANTHROPIC_API_KEY, $20 크레딧) | ✅ 환경변수 존재 | ~/.zshenv |
| GitHub 계정 + repo | ✅ four-pillars | docs/harness 용도 — 앱 repo 별도 생성 or 서브디렉토리 결정 필요 |
| Supabase 계정 + 프로젝트 | ❓ 미확인 | URL, ANON_KEY, SERVICE_ROLE_KEY 필요 |
| Vercel 계정 + GitHub 연동 | ❓ 미확인 | CLI 미설치 — 대시보드 배포로 대체 가능 |
| Node.js 18+ | ✅ v20.20.2 | |
| Playwright | ✅ v1.59.1 | |
| .env.local | ❌ 미생성 | 앱 루트에 생성 예정 |

---

## 앱 위치 결정

- **옵션 A**: 현재 repo(four-pillars) 안에 `sajutalk/` 서브디렉토리로 생성
  - 장점: docs·harness·앱이 한 repo, 관리 단순
  - 단점: Vercel monorepo 설정 필요 (`rootDirectory: sajutalk`)
- **옵션 B**: 별도 private repo `sajutalk` 생성 후 독립 배포
  - 장점: Vercel 원클릭, 앱 repo 깔끔
  - 단점: repo 2개 관리

→ **선택: A (서브디렉토리)** — docs/harness와 같은 repo에서 관리. Vercel rootDirectory 1줄 설정으로 해결.

---

## 빌드 순서 20단계

### Phase 0: 환경 세팅

| # | 단계 | 상태 |
|---|---|---|
| 1 | `npm create next-app sajutalk` — TS·Tailwind·App Router·src dir OFF | ⬜ |
| 2 | `npx shadcn init` — slate, CSS variables | ⬜ |
| 3 | shadcn 컴포넌트 설치: button, input, card, radio-group, checkbox, select | ⬜ |
| 4 | `.env.local` 생성 + 환경변수 채우기 (Supabase 값 입력 대기) | ⬜ |
| 5 | Supabase 연결 (lib/supabase/client.ts, server.ts) | ⬜ |
| 6 | DB 스키마 migration 생성·적용 | ⬜ |

### Phase 1: 만세력 + 검증 (최우선)

| # | 단계 | 상태 |
|---|---|---|
| 7 | `@fullstackfamily/manseryeok` 설치·래핑 (lib/manse/engine.ts) | ⬜ |
| 8 | **[검증 0]** Playwright 만세력 10건 검증 vs 포스텔러 — 10/10 통과 시 계속 | ⬜ |

### Phase 2: 백엔드 코어

| # | 단계 | 상태 |
|---|---|---|
| 9 | lib/prompts/ — interpret, qna, summary, classify (§6-a~d) | ⬜ |
| 10 | lib/state/chat-machine.ts — 화면 4 상태 A~F 머신 | ⬜ |
| 11 | API routes 스텁: session, manse, classify, interpret, qna, summary | ⬜ |

### Phase 3: 화면 구현

| # | 단계 | 상태 |
|---|---|---|
| 12 | 화면 1 — 생시 입력 (app/page.tsx) | ⬜ |
| 13 | 화면 2 — 고민 입력 (app/concern/page.tsx) | ⬜ |
| 14 | 화면 3 — 반복 패턴 4지선다 (app/pattern/page.tsx) | ⬜ |
| 15 | 화면 4 — 대화 화면, 상태 A~F, 스트리밍 (app/chat/page.tsx) | ⬜ |
| 16 | 화면 5 — 조건부 부모 생시/환경 요청 (화면 4 확장) | ⬜ |

### Phase 4: 검증·배포

| # | 단계 | 상태 |
|---|---|---|
| 17 | 시나리오 1·2 수동 E2E (localhost) | ⬜ |
| 18 | Vercel 배포 + 환경변수 설정 | ⬜ |
| 19 | [검증 1·2] 시나리오 E2E (production URL) | ⬜ |
| 20 | §12 완료 보고 생성 (docs/runs/completion.md) | ⬜ |

---

## 테스트 계획

### 자동화 테스트

**[검증 0] 만세력 Playwright (단계 8)**
- 파일: `sajutalk/lib/manse/verify.spec.ts`
- 대상: 무작위 10건 생성 (1950~2005, 0~23시)
- 방법: @fullstackfamily/manseryeok 결과 vs pro.forceteller.com 스크래핑
- 기준: 년주·월주·일주·시주 4글자 10/10 일치

**[검증 1·2] E2E 시나리오 (단계 19)**
- 파일: `sajutalk/tests/scenarios.spec.ts`
- 시나리오 1: 이직 고민 여성, 첫 세션, 3번 질문 완주 → 화면 5 노출 확인
- 시나리오 2: 연애 고민 여성, 2회차 세션, 2번 질문, [이제 됐어요] → 화면 5 미노출 확인

### 멈춤 트리거 (§9)

| 트리거 | 조건 |
|---|---|
| [0] 만세력 검증 실패 | 10건 중 1건이라도 불일치 |
| [1] 시크릿 커밋 | API key가 .env.local 밖 파일에 포함되려 할 때 |
| [2] 영구 삭제 | rm -rf, DROP TABLE |
| [3] 유료 티어 | Anthropic $20 초과, Supabase·Vercel 유료 업그레이드 |
| [4] 첫 공개 배포 직전 | Vercel production 배포 직전 |
| [5] 민감 개인정보 | 이혼·조실부모 원 단어가 DB 컬럼에 들어가려 할 때 |

### 재시도 상한 (§9.5)

- [상한 1] 같은 에러 3회 → 정지
- [상한 2] 한 단계 30분 초과 → 정지
- [상한 3] 총 세션 2시간 초과 → §12 부분 완료 보고 후 정지
