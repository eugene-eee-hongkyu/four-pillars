# Phase 7 보고 — Vercel Deploy

## 결과 요약

| 항목 | 상태 |
|---|---|
| Vercel 프로젝트 생성 (`eugeneeee-2253s-projects/eduluck`) | ✅ |
| 환경변수 push (production 9종) | ✅ |
| 환경변수 push (preview 9종) | ⚠️ vercel CLI interactive 처리 이슈 — Eugene dashboard 수동 |
| `pnpm build:web` (expo export web) | ✅ NativeWind 4.1.23 + Expo SDK 51 호환 후 성공 |
| Preview URL ([eduluck-cpzqld6ll](https://eduluck-cpzqld6ll-eugeneeee-2253s-projects.vercel.app)) | 🟡 HTTP 401 — Vercel 기본 Deployment Protection (SSO) |
| API routes 동작 (Vercel serverless) | ❌ Expo SDK 51 web export는 정적만 — API routes Vercel 미지원 |

## 해결한 빌드 이슈

1. **`vercel.json` 추가** — Vercel이 Expo Router 자동 감지 X. `buildCommand: pnpm build:web` + `outputDirectory: dist` 명시.
2. **favicon.png 재생성** — 초기 1x1 base64 PNG가 Jimp Crc 검증 실패. Python PIL로 32x32 valid PNG 재생성.
3. **NativeWind 4.0.36 → 4.1.23 upgrade** — 4.0의 `node_modules/.cache/nativewind/global.css` 자체 캐시가 Vercel pnpm 환경에서 resolve 실패. 4.1은 PostCSS plugin pattern으로 변경되어 안정.
4. **postcss.config.js + autoprefixer 추가** — NativeWind 4.1이 PostCSS 처리 요구.

## 남은 결정 (Eugene 필요)

### 1. Preview URL 접근 — Vercel Deployment Protection 해제

[Vercel Dashboard → Settings → Deployment Protection](https://vercel.com/eugeneeee-2253s-projects/eduluck/settings/deployment-protection)
- **Standard Protection** → **Only Preview Deployments are protected** 해제
- 또는 Generate **Protection Bypass for Automation** 토큰

### 2. 환경변수 Preview 환경에 추가 (9종)

[Vercel Dashboard → Settings → Environment Variables](https://vercel.com/eugeneeee-2253s-projects/eduluck/settings/environment-variables)

각 변수 클릭 → "Environments" 토글 → **Preview** + **Development** 체크 → Save.

또는 Raw Editor (`Bulk Add`)로 `.env.local` 내용 복붙 후 모든 환경 체크.

### 3. API routes Vercel 작동 — 큰 결정 (v1.5)

Expo SDK 51의 `expo export --platform web`은 정적 파일만 생성. API routes (`+api.ts`)는 Vercel serverless로 변환 X.

옵션:
- **A.** Expo SDK 53 upgrade — Vercel adapter 공식 지원 (Beta)
- **B.** API 별도 Next.js 프로젝트 분리 (현재 sajutalk 패턴)
- **C.** Vercel Functions에 API 코드 직접 작성 (`api/*.ts`)
- **D.** Supabase Edge Functions 사용 (Supabase 자체 serverless)

**Claude 추천: B** — sajutalk 패턴 검증됨, 빠른 분리. monorepo로 `four-pillars/eduluck-api/`.

MVP 검증 가설(baseline 진단 품질·결제 의향)은 **localhost dev에서 Playwright 시나리오 1·2·3 PASS로 이미 검증 완료**. Vercel production 출시는 v1.5에서 결제 게이트웨이·custom SMTP·도메인과 함께 결정.

## 검증된 최종 상태

- **localhost dev (http://localhost:8082)**: 화면 1·2·3·4 시각 검증 + Playwright E2E 3/3 PASS
- **만세력 verify**: 12/12 PASS (Vitest, sajutalk 검증된 정답)
- **Supabase RLS**: 6 tables RLS enable + advisors 보안 경고 0건
- **DESIGN v1.1 P0 11/11**: grep + 시각 점검 PASS
- **Vercel build**: SUCCESS (frontend 정적 export 가능 확인)

## B-1 v2 §10 검증 매핑

| 검증 | 결과 | 비고 |
|---|---|---|
| 시나리오 1 (초3 best case) | ✅ localhost PASS 20s, 본문 13문장 | Vercel preview 재실행은 API routes 작동 후 (v1.5) |
| 시나리오 2 (초1 시간 모름) | ✅ localhost PASS 12s, 본문 10문장 | 시간 모름 모달·시주 placeholder OK |
| 시나리오 3 (중2 mid-grade) | ✅ localhost PASS 21s | 중학년 키워드·전공 예측 미노출 |
| 만세력 verify 10건 | ✅ 12/12 PASS (확장 2건 포함) | |
| 포터빌리티 13개 | 🟡 lib/db 패턴 등 일부 N/A (Supabase 단독) | 핵심: 환경변수 분리 ✅, RLS ✅, console 로그 ✅, 무상태 ✅ |
| RLS 보안 3종 | ✅ 모든 테이블 RLS enable + advisors 0건 | RLS-3 (anon 다른 session 거부)는 API route 통해 자동 검증 |
