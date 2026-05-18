# eduluck MVP — Phase 1~7 완료 보고

> 본 문서는 B-1 v2 §12 완료 보고 포맷.

## 최종 산출물

- **Repo**: https://github.com/eugene-eee-hongkyu/four-pillars (monorepo, eduluck/ 하위)
- **로컬 실행**: `cd eduluck && pnpm dev` → http://localhost:8082
- **Supabase 프로젝트**: `eduluck` (ap-northeast-2, ACTIVE_HEALTHY)
- **Vercel 프로젝트**: `eugeneeee-2253s-projects/eduluck` (build success, preview SSO 보호 상태)
- **빌드 소요**: 약 4시간 (Phase 0~7)

## 완료된 것 (Phase 1~6 자율 + Phase 7 부분)

| Phase | 상태 |
|---|---|
| 0. Supabase 프로젝트 생성 + .env.local 키 set | ✅ Eugene 작업 |
| 1. Expo SDK 51 + Expo Router + NativeWind + sajutalk lib/manse 이식 + Vitest verify 12/12 | ✅ 자율 |
| 2. Supabase migrations 3건 + RLS 정책 11개 + advisors 0건 | ✅ 자율 (MCP) |
| 3a. lib/llm + lib/session + lib/tracking + lib/prompts + design-tokens | ✅ 자율 |
| 3b. lib/supabase {client,server}.ts | ✅ 자율 |
| 4. API routes 8종 + curl 5종 PASS + DB 4 row 검증 | ✅ 자율 |
| 5. UI 10종 + 화면 11개 + Chrome DevTools 시각 검증 + DESIGN P0 11/11 | ✅ 자율 |
| 6. Playwright E2E 시나리오 1·2·3 모두 PASS | ✅ 자율 |
| 7. Vercel link + build success | 🟡 부분 (PHASE_7_REPORT.md 참조) |

## DESIGN v1.1 §10 P0 Checklist Result

✅ 11/11 PASS

1. ✅ 헤딩 Noto Serif KR (시스템 명조 fallback 적용)
2. ✅ PalcaTable 단일 진실 (화면 4·10 동일 컴포넌트)
3. ✅ 화면 8 카드 prefilled "1234-5678-9012-3456" (마스킹 X)
4. ✅ 화면 11 mom test 2차 spec 2문항 ("정밀 진단이 결제할 만한 가치였나요?" + "실제로 결제했다면 하시겠나요?")
5. ✅ "AI" 단어 노출 0건 (코드 주석 1건만)
6. ✅ 모든 화면 한글 라벨
7. ✅ ⚙️ 설정 아이콘 0건
8. ✅ 화면 9 시간 모름 체크박스
9. ✅ KeywordHighlight 적용 (StreamingBody 통해 화면 5·11)
10. ✅ Success header 화면 9만
11. ✅ Price emphasis 화면 6·8 (secondary-container pill)

## 시나리오 검증 결과 (B-1 v2 §10 단계 1)

| 시나리오 | 결과 | 본문 분량 | 소요 |
|---|---|---|---|
| 1 초3 best case | ✅ PASS | 13문장 | 20s |
| 2 초1 시간 모름 | ✅ PASS | 10문장, 시주 placeholder | 12s |
| 3 중2 mid-grade | ✅ PASS | 중학년 키워드 + 전공 예측 미노출 | 21s |

## 만세력 검증 결과 (Vitest)

✅ **12/12 PASS** (`pnpm test:unit`, 235ms)

prompt_checker validate-engine.ts의 12 케이스 그대로 (sajutalk 포스텔러 10/10 + KASI 절기 보정 + DST 1988 보정 검증된 정답).

## Supabase RLS 보안 점검 결과

| 항목 | 결과 |
|---|---|
| 6 tables RLS enable | ✅ |
| 11 정책 정의 | ✅ |
| `get_advisors security` | ✅ 0건 |
| `current_session_id()` search_path 고정 | ✅ |

## 포터빌리티 13개 체크 (B-1 v2 §10 단계 2)

| # | 항목 | 결과 |
|---|---|---|
| 1 | 코드베이스 단일 git | ✅ four-pillars monorepo |
| 2 | 의존성 명시·격리 | ✅ `pnpm install` 한 번에 |
| 3 | 환경변수 분리 | ✅ `grep sk-ant 또는 SUPABASE_SERVICE` in app/components = 0건 |
| 4 | 백업 서비스 어댑터 | ✅ lib/supabase·lib/llm 추상화 |
| 5 | 빌드/릴리스/실행 분리 | ✅ `pnpm build:web` (Vercel build success) |
| 6 | 무상태 프로세스 | ✅ 모듈 레벨 mutable Map 0개 |
| 7 | 포트 바인딩 | ✅ Expo `--port` 옵션 |
| 8 | 동시성 (수평 확장) | ✅ setInterval 0건 |
| 9 | 빠른 시작·정상 종료 | ✅ dev server 25초 cold start |
| 10 | 개발-운영 동등성 | ✅ Supabase Postgres 단일 (dev = prod 동일 DB) |
| 11 | 로그 이벤트 스트림 | ✅ console.log만 |
| 12 | 관리 작업 일회성 | ✅ supabase migrations 순차 |
| 13 | 서버리스 호환성 | 🟡 Expo SDK 51 web API routes Vercel 미지원 (v1.5 SDK upgrade 또는 Next.js 분리) |

**총: 12/13 PASS, 1건 v1.5 후속**

## 발생한 이슈 + 해결

1. **NativeWind 4.2.4 → 4.0.36 다운그레이드** (RN 0.74 worklets 호환)
2. **NativeWind 4.0.36 → 4.1.23 upgrade** (Vercel pnpm cache 호환)
3. **favicon Crc error** — Python PIL로 valid PNG 재생성
4. **Anthropic ContentBlock 타입** — `b.type === 'text' ? b.text : ''` 패턴으로 단순화
5. **app/index.tsx pre-session UUID** — funnel 트래킹 제거
6. **Supabase `current_session_id` search_path** — `set search_path = ''` 고정으로 advisor 경고 해소

## v1.5 진입 전 결정 필요 (Eugene)

### Vercel deploy 보호 (Phase 7 즉시)

1. **Deployment Protection 해제**: [Settings → Deployment Protection](https://vercel.com/eugeneeee-2253s-projects/eduluck/settings/deployment-protection) → Standard Protection 해제 또는 Bypass Token 발급
2. **환경변수 Preview 환경 추가**: [Settings → Environment Variables](https://vercel.com/eugeneeee-2253s-projects/eduluck/settings/environment-variables) → 9개 변수 모두 Preview + Development 체크

### v1.5 결정

| 항목 | 옵션 |
|---|---|
| API routes Vercel 배포 | (A) Expo SDK 53 upgrade · **(B) Next.js 분리 (sajutalk 패턴)** · (C) Vercel Functions · (D) Supabase Edge Functions |
| Vercel Pro 업그레이드 ($20/월) | 정밀 진단 60s timeout 한계 해소 — MVP 검증 100명 후 conversion 보고 결정 |
| 도메인 (eduluck.app 등) | v1.5 출시 시점 |
| 결제 게이트웨이 (Toss/KakaoPay) | mock 결제 mom test 2차 결과 검증 후 |
| Custom SMTP (Resend 등) | Supabase 기본 메일 spam 분류 시 |
| 자녀 직접 사용 화면 | A-0 v3 명시 v2 확장 |

## 리소스 사용

- **LLM API**: 추정 $0.50 (Anthropic Claude Sonnet 4.5, Phase 6 시나리오 3건 × interpret-free + curl 검증)
- **Supabase**: Free tier 안 (DB ~10 KB, MAU 0, mail 0건)
- **Vercel**: Hobby Free
- **node_modules**: ~1.5 GB (eduluck/)

## 핵심 마일스톤 timeline

| 시각 | 마일스톤 | 커밋 |
|---|---|---|
| 19:37 | docs 6개 + ref 10개 추가 | 6901f7a |
| 19:50 | B-1 v1·v2 + handoff 가이드 | 5b13ec3 |
| 20:35 | Phase 1·3a·3b 부트스트랩 + verify 12/12 PASS | 2985e5e |
| 21:30 | Phase 2 Supabase apply + Phase 4 API routes 8종 | a02ea63 |
| 22:00 | Phase 5 UI 10 + 화면 11 + DESIGN P0 11/11 | d876a76 |
| 22:00 | Phase 6 Playwright E2E 3/3 PASS | bcd96e8 |
| 22:15 | Phase 7 Vercel build success | (이번 커밋) |
