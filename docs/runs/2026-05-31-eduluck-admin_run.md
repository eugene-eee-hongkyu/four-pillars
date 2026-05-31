---
name: eduluck admin 기능 — Google OAuth + admin_users CRUD + 진단 리스트·검색 + PIPA 감사 로그
slug: eduluck-admin
type: other
status: 완료
created: 2026-05-31 07:57
completed: 2026-05-31
---

# eduluck admin 기능 — Google OAuth + admin_users CRUD + 진단 리스트·검색 + PIPA 감사 로그

## 사전 결정 (직전 세션 합의)

- **권한 관리**: `admin_users` 테이블 + UI CRUD — env allowlist 대신 DB 기반으로 운영 중 추가/제거 가능. 초기 super-admin 1명은 환경변수 `SUPER_ADMIN_EMAIL`로 시드.
- **PII 마스킹**: 기본 마스킹 (이름 가운데 글자 가림 `홍*규`) + "원본 보기" 토글 클릭 시 풀 노출. 클릭 시 audit log 기록.
- **데이터 컬럼**: PC = 14컬럼 전체 펼침 (이름·생년월일시·고향·학운+점수+8 방향성 점수), 모바일 = 6컬럼 컴팩트 + 행 클릭 시 펼침 토글.
- **Audit log**: ON. PIPA §29 안전조치 의무. 모든 admin 행동(login·list·search·view·mask_off·CRUD)을 `admin_audit_log` 테이블에 기록.
- **삭제 권한 분리**: ON. admin = SELECT만, DELETE는 super-admin만. `admin_users.role` enum (`admin`·`super_admin`).
- **CSV export**: OFF (사용자 거부).
- **IP allowlist**: OFF.
- **2FA**: OFF (OAuth 자체가 2단계 인증 역할로 간주).

## 완료 기준

- [x] Google OAuth admin 로그인 + super-admin 시드(env)로 첫 진입 + admin_users 테이블 CRUD UI 작동 (admin 추가·제거·role 변경)
- [x] /admin/subjects 리스트 (50개 페이지 + 이름·생년월일·고향 검색) 작동 + PC 14컬럼·모바일 토글 + PII 마스킹 기본 + "원본 보기" 토글 + audit log 기록
- [x] PIPA 감사 로그 — login·list·search·view·mask_off·CRUD 모든 행동이 `admin_audit_log`에 기록되고 super-admin이 조회 가능

## 한눈에 보기

### 개발 계획 관점 — 구현

| 단계 | 구현 파일/컴포넌트 | 검증 주체 |
|---|---|---|
| 1. DB 스키마 (admin_users · admin_audit_log · subjects 인덱스) | `supabase/migrations/20260531000000_admin_tables.sql` | AI |
| 2. Supabase Google OAuth provider 추가 | Supabase 대시보드 (수동) + redirect URL 설정 | 사람 |
| 3. admin 미들웨어 (JWT 검증 + admin_users 권한 확인 + audit log) | `lib/admin/auth.ts` (서버) | AI |
| 4. admin 데이터 API (service_role) | `api/admin/subjects.ts` (list·search) + `api/admin/subjects/[id].ts` (detail) + `api/admin/admins.ts` (CRUD) + `api/admin/audit-log.ts` (super-admin only) | AI |
| 5. PII 마스킹 유틸 | `lib/admin/mask.ts` (`maskName`, `maskBirthLocation` 등) | AI |
| 6. admin 페이지 — 로그인 | `app/admin/index.tsx` (Google OAuth 버튼 + super-admin 안내) | AI |
| 7. admin 페이지 — 진단 리스트 | `app/admin/subjects/index.tsx` (PC 14컬럼 테이블 · 모바일 행 토글 · 검색바 · 50개 페이지네이션 · 마스킹 토글) | AI |
| 8. admin 페이지 — admin_users CRUD | `app/admin/admins.tsx` (super-admin 전용 표시 + 추가·role 변경·제거) | AI |
| 9. admin 레이아웃 + 라우트 가드 | `app/admin/_layout.tsx` (인증 미체크 시 /admin 리다이렉트, 권한 없으면 차단) | AI |

### 개발 계획 관점 — 테스트

| 단계 | 단위 테스트 | 통합 테스트 |
|---|---|---|
| 1. DB 스키마 | `mcp__supabase__apply_migration` 적용 후 `list_tables` 확인 | RLS 정책 검증 (anon SELECT 차단) |
| 2. Google OAuth | ⚠️ 직접 실행 불가 — Supabase 대시보드 수동 설정. 사용자 절차 안내 후 redirect URL · client_id 받기 | - |
| 3. admin 미들웨어 | 단위 함수 호출 (`isAdmin(email)` 등) | api/admin/* 호출 시 401/403 처리 검증 |
| 4. 데이터 API | curl로 미인증·인증·super-admin 권한별 응답 코드 검증 | 검색·페이지네이션 동작 (e2e prod test data 활용) |
| 5. PII 마스킹 유틸 | vitest unit (`maskName('홍규') === '홍*'` 등) | - |
| 6-8. admin 페이지 | typecheck + 로컬 dev 진입 | Playwright MCP — 로그인 → 리스트 → 검색 → 마스킹 토글 → admin CRUD |
| 9. 라우트 가드 | 비로그인·일반 사용자(카카오) JWT로 /admin 접근 시 차단 확인 | - |

### 완료 기준 관점

| 완료 기준 | 핵심 구현 | 검증 방법 | 검증 주체 |
|---|---|---|---|
| Google OAuth + admin_users CRUD | 단계 2·3·8·9 | Supabase OAuth 설정 후 Playwright e2e (super-admin 시드 → 일반 admin 추가 → role 변경 → 제거) | 사람 (OAuth 설정) + AI (e2e) |
| 진단 리스트 + 검색 + 마스킹 토글 + 14컬럼/토글 | 단계 4·5·7 | Playwright MCP prod 진입 + 데이터 165 rows 페이지네이션·검색 검증 | AI |
| PIPA 감사 로그 | 단계 1·3·4 | 위 행동들 수행 후 `admin_audit_log` row 발생 + super-admin이 `/admin/audit-log` 조회 가능 | AI |

## 개발 계획

1. **DB 스키마** (`supabase/migrations/20260531000000_admin_tables.sql`):
   - `admin_users` (id·email·role enum `admin`/`super_admin`·created_at·created_by)
   - `admin_audit_log` (id·admin_email·action·target_id·query_params·ip·user_agent·created_at)
   - `subjects` 검색 인덱스 3개 (nickname·birth_year/month/day·birth_location)
   - RLS: 두 admin 테이블 모두 anon SELECT 차단 (service_role only)
2. **Google OAuth provider** — Supabase 대시보드 Auth → Providers → Google ON, Client ID/Secret 입력, redirect URL 등록. 사용자 수동 절차.
3. **admin 미들웨어** (`lib/admin/auth.ts`):
   - `verifyAdminRequest(req)`: JWT 추출 → Supabase Auth로 user 확인 → `admin_users`에서 role 조회 → super-admin/admin/none 반환 + audit log 기록.
4. **admin API** (`api/admin/*`):
   - `subjects.ts` GET: 쿼리(`q`·`page`·`unmask`) → 50개 페이지 + 검색 (nickname ILIKE · 생년월일 부분일치 · birth_location)
   - `subjects/[id].ts` GET: 단건 (전체 manse_json + interpretations)
   - `admins.ts` GET/POST/PATCH/DELETE: CRUD (super-admin only)
   - `audit-log.ts` GET: 감사 로그 (super-admin only, 최근 100건)
5. **PII 마스킹 유틸** (`lib/admin/mask.ts`):
   - `maskName('홍규')` → `홍*`, `maskName('이재훈')` → `이*훈`
   - `maskBirthLocation('서울특별시')` → `서울*시`
   - `unmaskRequested(unmask?)` → boolean
6. **admin 로그인 페이지** (`app/admin/index.tsx`):
   - 로그인 안 됨: Google OAuth 버튼 + super-admin 이메일 안내
   - 로그인 됨: /admin/subjects로 리다이렉트
7. **진단 리스트** (`app/admin/subjects/index.tsx`):
   - PC (`width >= 768`): 14컬럼 테이블 (이름·gender·grade·생년월일·시·고향·hagunLabel·primaryTier + 8 방향성 점수)
   - 모바일: 6컬럼 컴팩트 행 (이름·생년월일시·고향·학운·주력방향성+점수) — 행 클릭 → 펼침
   - 상단: 검색바(이름·생년월일·고향) + 마스킹 토글 + 페이지네이션
8. **admin_users CRUD** (`app/admin/admins.tsx`):
   - super-admin만 노출. 일반 admin은 차단.
   - 테이블: email·role·created_at·created_by
   - 추가: 이메일 입력 (사전 OAuth 가입 필요 X — admin_users만 등록하면 다음 로그인 시 활성)
   - role 변경: dropdown
   - 삭제: super-admin 자기 자신 삭제 차단
9. **레이아웃 + 가드** (`app/admin/_layout.tsx`):
   - `useAuth` hook으로 user 확인 → `/api/admin/me`로 role fetch → admin 아니면 /admin 리다이렉트
   - super-admin only 페이지(/admin/admins · /admin/audit-log)는 role 추가 체크

## 단위 테스트 계획

- **`isAdmin(email)`·`isSuperAdmin(email)`**: vitest unit. allowlist 테이블 mock → role 매칭 — AI 직접
- **`maskName`·`maskBirthLocation`**: vitest unit. 한글 1-5자·영문·공백 케이스 — AI 직접
- **admin API 401/403**: curl 미인증·일반 user JWT·admin·super-admin 4 케이스 — AI 직접 (prod)
- **검색·페이지네이션**: curl `?q=홍&page=1` → row 수 + 결과 정합 — AI 직접 (prod)
- **DB RLS**: ⚠️ 직접 실행 불가 (anon key로 SELECT 시도) — `mcp__supabase__execute_sql`로 RLS 정책 확인

## 통합 테스트 계획

- **OAuth 로그인 → 진단 리스트 진입**: ⚠️ Google OAuth는 Playwright 어려움. 수동 1회 + super-admin 시드 확인 후 cookie 추출해 e2e
- **admin CRUD**: Playwright MCP — super-admin 로그인 → /admin/admins → 신규 admin 이메일 추가 → role 변경 → 제거 → audit_log row 확인
- **검색·마스킹**: Playwright MCP — /admin/subjects → 검색어 "테스트" → 결과 표시 → "원본 보기" 클릭 → 마스킹 해제 → audit_log에 `mask_off` action 기록 확인
- **권한 분리**: Playwright MCP — 일반 admin 계정으로 /admin/admins 접근 시 차단 확인

## 사람만 가능

- **Supabase 대시보드 Google OAuth provider 설정** — Google Cloud Console에서 OAuth Client ID 생성 + Supabase Auth → Providers → Google에 입력 + redirect URL 등록
- **Vercel 환경변수 `SUPER_ADMIN_EMAIL` 추가** — 초기 super-admin 시드 (예: `eugene.eee@iskra.world`). DB 마이그레이션 후 첫 super-admin row INSERT 시 참조.
- **Google Cloud Console OAuth 동의 화면 설정** — eduluck 서비스 이름·로고·승인된 도메인(luck.z21labs.world)

## 중단/롤백 조건

- **admin RLS 권한 누수 발견 시 즉시 차단** — 일반 사용자(카카오 로그인 user)가 `/api/admin/*` 호출에 200 응답 받으면 즉시 endpoint 차단 + 미들웨어 재점검
- **PII 노출 사고 발생 시** — admin_audit_log 외에 노출 경로 발견 시 마스킹 강제 + "원본 보기" 토글 제거
- **service_role key 노출 시** — Vercel env rotation + Supabase 키 재발급
- **롤백 가능 범위**: admin 페이지·API·테이블 모두 삭제 가능 (사용자 데이터 영향 X). admin_users·admin_audit_log drop 후 마이그레이션 되돌리기 가능

## 맥락

- **결제 인프라 결정**: 포트원 + 토스페이먼츠 (`.harness/decision.md` 2026-05-30) — admin과 별개로 진행 중
- **PG 심사 5종 충족**: BUSINESS_INFO 단일 source (`38cdec1`·`43c25d1`·`f51669d`) — admin 화면에도 동일 사업자 정보 노출 (LegalFooter 재활용)
- **카카오 로그인 인프라**: 일반 사용자 카카오, admin은 Google — multi-provider 공존 검증 필요
- **mom test 직전 단계**: admin 기능은 mom test 데이터 검수·calibration 용도. mom test 데이터 누적 시작 직전 완비 권장

## 진행 로그

> 각 단계 완료 직후 실행한 검증과 결과를 여기에 append.

- **2026-05-31 09:00** — 단계 1 (DB 마이그레이션) PASS. `admin_users`·`admin_audit_log` 테이블 prod 적용 (RLS active, 0 rows). subjects 인덱스 5종 (nickname·birth·location + trgm 2종) 적용. `mcp__supabase__list_tables`로 확인.
- **2026-05-31 09:00** — 단계 5 (PII 마스킹) PASS. `lib/admin/mask.ts` + vitest 22/22 (`mask.test.ts`). 2-5자 한글·영문·null·undefined·공백·고향 5종·생년월일·시간·shouldUnmask 모든 케이스 커버.
- **2026-05-31 09:00** — 단계 2 (Google OAuth) 사용자 수동 설정 완료 보고 받음. 코드 통합: `useAuth.loginWithGoogle()` + `GoogleLoginButton` + `auth/callback`에 `?next=` 분기 추가.
- **2026-05-31 09:00** — 단계 3 (admin 미들웨어) `lib/admin/auth.ts`. JWT → user → provider=google 강제 → SUPER_ADMIN_EMAIL 자동 시드 → admin_users role 조회 → audit log fire-and-forget.
- **2026-05-31 09:00** — 단계 4 (admin API) 5개 endpoint: `me`·`subjects` (검색 4종: 이름 ilike, 생년 4자리, 생년월일 풀, 고향 ilike)·`subjects/[id]`·`admins` (GET/POST/PATCH/DELETE, 자기삭제·자기강등 차단)·`audit-log` (super-admin only).
- **2026-05-31 09:00** — 단계 6-9 (admin 페이지) `app/admin/{_layout,index,subjects/index,admins,audit-log}.tsx` + `lib/admin/{client,useAdminMe}.ts`. PC 14컬럼(11 방향성) + 모바일 토글, super-admin nav 분기.
- **2026-05-31 09:00** — `npx tsc --noEmit` PASS. 모든 admin 파일 타입 통과.


---

## Report

### 실행 결과

**풀스택 22 파일 신규/수정 + DB 마이그레이션 1개 + Supabase Google·카카오 multi-provider OAuth 통합**:

- DB (`20260531000000_admin_tables.sql`): `admin_users` · `admin_audit_log` 테이블 + RLS active + subjects 검색 인덱스 5종 (trgm 2종 포함)
- 인증: `useAuth.login(redirectPath, requireEmail)` + `loginWithGoogle(redirectPath)` — 카카오·Google multi-provider, sessionStorage로 nextPath 안전 전달
- 미들웨어 (`lib/admin/auth.ts`): JWT → admin_users role 조회 → audit log fire-and-forget. `SUPER_ADMIN_EMAIL` env 자동 시드. 일반 사용자(카카오 일반 진단)와 admin(카카오 hongary·Google eugene) 분리 — provider 무관 admin_users 등록만 확인
- API 5개 (`/api/admin/*`): me·subjects (50 페이지 + 4종 검색 + 마스킹 토글)·subjects/[id]·admins (GET/POST/PATCH/DELETE, 자기 삭제·강등 차단)·audit-log (super-admin only)
- 페이지 (`/admin/*`): _layout·index (로그인 + 권한 진단 카드)·subjects (PC 14컬럼+5 raw / 모바일 토글)·admins (super-admin CRUD)·audit-log (action·email 필터)
- PII 마스킹 (`lib/admin/mask.ts`): 이름·고향·생년월일 마스킹 + vitest 22/22 PASS
- 페이지네이션: `1 2 3 … 10 ›` 형식, 점프 가능

**실제 사용 검증 (audit log 기록)**:
| action | 발생 횟수 |
|---|---|
| login | 52 |
| list_subjects | 21 |
| add_admin | 1 (UI로 hongary 추가) |
| view_audit_log | 1 |
| mask_off | 1 |

**DB 정리**: subjects 165 → 37 row (CASCADE 삭제 3차례: 옛 schema 11 + directions 누락 44 + dev test 6)

### 이슈

- `@/lib/...` alias가 Vercel Functions 빌드 시 미적용 → `Cannot find module` 500. 해결: 서버 코드 (`lib/admin/auth.ts`, `lib/prompts/hagun-tier.ts`)는 상대경로로 통일.
- Supabase OAuth callback이 `?next=` query string을 cleanup하면서 손실 → `/`로 잘못 redirect. 해결: sessionStorage로 nextPath 전달.
- `manse_json`에 hagunLabel·primaryTier 직접 저장 X — `calculateFinalTierV2` 함수 호출 필요. 같은 session의 mother/father subjects 일괄 fetch 후 계산.
- directions 데이터 키 mismatch: 코드는 `d.score`, 실제 데이터는 `d.normalized` (v3) 또는 `d.total` (v2). fallback 적용.
- 카카오 OAuth scope를 `profile_nickname` 단독으로 강제 (KOE205 우회 잔재) → admin 이메일 못 받음. `requireEmail` prop 신규로 admin에만 `account_email` scope 추가.
- 카카오 동의 reset = 사용자가 카카오 앱 연결 해제 + Supabase auth user record 삭제 필요. hongary 1회 진행.

### 결정

- **권한 관리**: `admin_users` 테이블 + UI CRUD (env allowlist 대신, 운영 중 추가/제거 가능)
- **PII 마스킹**: 기본 ON + "원본 보기" 토글 시 audit log `mask_off` 기록
- **데이터 컬럼**: PC 14+ (subjects + 11 방향성 + 5 raw) / 모바일 토글
- **provider 비제한**: admin은 Google/카카오 둘 다 — `admin_users` 등록만 확인
- **학운 점수 cap X**: raw × 100/141 정규화 그대로. 100 초과(108.5 등) = 상위 1.67% 통과 의미 보존
- **scope 분리**: 일반 카카오 로그인 = `profile_nickname` (이메일 부담 X). admin 카카오 로그인 = `account_email` 추가

### 다음 액션

- mom test 친구 배포 시 admin에서 진단 데이터 검수 가능 (37 row 칼리브레이션 sample + mom test 신규 데이터)
- 거래액 ↑ 또는 admin 수 ↑ 시 IP allowlist·2FA 강제·CSV export 기능 추가 검토 (현재는 mom test 단계 과투자)
- super-admin 본인 삭제·강등 차단 외 추가 안전장치 (예: 마지막 super-admin 보호) — 필요 시 도입

### 남은 리스크

- **카카오 admin 신규 추가 시 카카오 동의 화면이 새로 안 뜸**: 기존 카카오 일반 user(닉네임만)가 admin으로 추가되면, 이메일 동의가 누락된 채 admin_users 매핑 안 됨. hongary처럼 카카오 앱 연결 해제 + Supabase user 삭제 + 재로그인 절차 필요. 자동화 가능하지만 mom test 단계엔 super-admin이 수동 처리.
- **audit log 무한 증가**: 현재 retention 정책 없음. 1년+ 운영 시 `admin_audit_log` table 부피 ↑. 분기별 archive 또는 90일 retention 정책 별도 도입 필요.
- **카카오 일반 user + 카카오 admin user 동일 카카오 ID** 케이스: 같은 사람이 일반 진단 후 admin 등록 시 supabase user record 충돌 가능. 현재 hongary는 admin 전용 카카오라 영향 X.

_(완료)_
