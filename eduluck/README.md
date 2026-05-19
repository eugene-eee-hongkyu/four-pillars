# eduluck

> 학생(초·중·고) 자녀를 둔 30~45세 어머니용 사주 학운 진단 MVP.
> 자녀 사주 무료 간이 진단 → 어머니 사주 추가 정밀 진단 첫 결제(3,000원 mock).

**Production**: https://four-pillars-alpha.vercel.app
**Repo**: https://github.com/eugene-eee-hongkyu/four-pillars (monorepo, `eduluck/` 하위)

---

## 빠른 시작

```bash
pnpm install
pnpm dev           # localhost:8082 (Expo Web)
pnpm test:unit     # 만세력 verify 12/12
pnpm test:e2e      # Playwright 시나리오 1·2·3
```

Eugene 셋업 가이드 (Supabase·Vercel·.env.local): [docs/SETUP.md](docs/SETUP.md)

---

## 스택

- **프레임워크**: Expo SDK 51 + Expo Router v3 (web export → Vercel SPA + Functions)
- **UI**: NativeWind 4.1 + Tailwind, Pretendard 본문 + Noto Serif KR 헤딩·한자
- **DB**: Supabase Postgres + RLS (6 tables, 11 정책)
- **인증**: Supabase Auth (이메일·비밀번호, 자동 로그인)
- **LLM**: Anthropic Claude Sonnet 4.6 streaming
- **만세력**: `@fullstackfamily/manseryeok` + `lunar-typescript` + 자체 절기·DST 보정 ([sajutalk 검증된 모듈](../sajutalk/lib/manse/) 이식)

---

## 문서 구조

```
eduluck/
├── README.md                 ← 본 파일
├── SPEC.md                   ← Claude Code·Cursor 자동 인식 (B-1 v2 요약)
└── docs/
    ├── SETUP.md              ← 사람 셋업 가이드 (Supabase·Vercel)
    ├── plan/                 ← A 트랙 기획 (Eugene 하네스 v16)
    │   ├── A-0_v3.md         · 핵심 가설 + 타겟 + MVP 경계
    │   ├── A-1_v4.md         · Phase 구조 13 Step + 시나리오 + 톤 마커
    │   ├── A-2_v2.md         · 화면 11개 풀 spec (wireframe 포함)
    │   ├── A-3a_v1.md        · 디자인 컨셉 결정 (Warm Heritage)
    │   └── A-3b_v1.md        · 전체 화면 적용 + P0 checklist
    ├── build/                ← B 트랙 빌드 지침
    │   ├── B-1_v1.md         · 로컬 우선 버전 (초안)
    │   ├── B-1_v2.md         · Vercel·Supabase 즉시 채택 (확정, Claude Code 입력)
    │   └── handoff_README.md · 디자인·기획 → 빌드 handoff bundle
    ├── design/               ← 디자인 시스템 + 리뷰
    │   ├── DESIGN_v1.1.md    · Warm Heritage 토큰·컴포넌트·P0 checklist 11종
    │   └── DESIGN_UX_REVIEW.md ← 종단 검증 후 3 페르소나 리뷰 + 우선순위
    ├── reports/              ← 진행 보고서
    │   ├── COMPLETION_REPORT.md · Phase 1~9 종합
    │   └── PHASE_7_REPORT.md    · Vercel 트러블슈팅 + 남은 결정
    └── ref/                  ← Eugene 기획 하네스 v16 참고 자료
```

---

## 핵심 검증

| 항목 | 결과 |
|---|---|
| 만세력 verify | ✅ 12/12 PASS (sajutalk + KASI + DST 검증 정답) |
| Supabase RLS | ✅ 6 tables enable + advisors 0건 |
| Playwright E2E | ✅ 시나리오 1·2·3 (초3·초1 시간모름·중2) |
| DESIGN P0 | ✅ 11/11 PASS (grep + 시각) |
| Vercel deploy | ✅ frontend SPA + 9 API functions |
| 종단 검증 | ✅ Eugene 화면 1→11 끝까지 작동 (signup·결제·정밀 진단) |

---

## 다음

UX 리뷰 옵션 B 적용 중 (Quick Wins 5 + 중요 fix 5 = 10건): [docs/design/DESIGN_UX_REVIEW.md](docs/design/DESIGN_UX_REVIEW.md)
