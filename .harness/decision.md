# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-31.md](archive/decision-2026-05-31.md)

---

## 2026-05-31: SDK 52 dependency 전략 — shamefully-hoist + supabase 2.104 lock

- **선택**: `.npmrc shamefully-hoist=true` (pnpm root에 모든 transitive deps hoist, npm 동작 모방) + `@supabase/supabase-js: 2.104.1` exact lock + 누락 4 deps 명시 추가
- **대안 검토**:
  - A. **deps 하나씩 fix 계속** — Vercel build error마다 누락 dep만 명시 추가. 4번 시도했으나 매번 새로운 누락 발견 (metro-runtime → expo-asset → worklets → opentelemetry). 추가 누락 가능성 미해결.
  - B. **shamefully-hoist=true (선택)** — pnpm strict resolution 우회. 모든 transitive deps root에 가시화. Vercel pnpm v10·local v11 동작 통일. 향후 추가 누락도 자동 처리.
  - C. **SDK 51 유지** — 위험 회피. 단 React Native 0.74·React 18.2 멈춤. 보안 패치 포기.
- **선택 이유**:
  - shamefully-hoist는 pnpm 표준 옵션 (이름만 악마적, npm 동작). 모노레포 격리는 단일 패키지라 의미 X.
  - supabase 2.104.1 exact: ^2.104.1이 2.106.2로 자동 upgrade되며 dynamic `@opentelemetry/api` import 추가 → 누락 감지. 박제로 차단.
  - SDK 52 upgrade는 mom test 전에 끝내야 — 옛 SDK 보안 패치 부재.
- **영향 범위**: `eduluck/.npmrc` 신규 + `eduluck/package.json` 17 deps. 모든 의존성이 root hoist → dep ↔ dep 격리 깨질 수 있음 (모노레포 X라 미미). build:web local·prod 모두 PASS.
- **되돌리는 방법**: `.npmrc` shamefully-hoist 제거 + supabase-js 버전 lock 해제. ERROR 다시 발생 시 누락 명시 추가 패턴으로 회귀.

---

## 2026-05-31: localStorage PII 정리 Phase 1·2 — auth 동기화 위치·로그아웃 처리·claim 가드

- **선택**: **FlowProvider useEffect 한 곳에 모든 auth 동기화** + **로그아웃 시 localStorage[STORAGE_KEY] 완전 삭제** + **POST /api/sessions/claim 가드: device_id 매칭 + user_id IS NULL**
- **대안 검토**:
  - **위치**: useAuth hook 안 vs FlowProvider. useAuth는 여러 컴포넌트에서 호출되어 mount당 listener 박힘 위험. FlowProvider는 root 1회 마운트 보장.
  - **로그아웃 정리 범위**:
    - A. sessionsHistory만 비우고 본문 캐시 유지 — 본문도 회원 PII로 분류해야 PIPA 안전.
    - B. **STORAGE_KEY 통째 삭제 (선택)** — 자녀 정보·본문·dedup 배열 일괄. deviceId만 보존 (Mixpanel distinct_id).
    - C. signOut() 후 페이지 reload — 단순하지만 UX 거침.
  - **claim 가드**:
    - sessionId만 매칭: 누구나 sessionId 알면 가로채기 가능.
    - **device_id 매칭 + user_id IS NULL (선택)**: 같은 device의 사용자만 + 이미 매핑된 row 자동 skip (idempotent).
- **선택 이유**:
  - FlowProvider 단일 useEffect: state·auth 변화 한 자리 보존. lastSyncedUserIdRef로 StrictMode 중복 방지.
  - 로그아웃 통째 삭제: 회원 자녀 데이터가 device에 남으면 가족 공유 PC에서 다음 사용자가 볼 위험. deviceId 유지로 funnel 연속성.
  - device_id 가드: 비회원 시점에 device_id 박혔으므로 같은 device만 claim. cross-device 침입 불가. 옛 device_id NULL sessions는 자동 제외 (재원 9건 — 사용자 결정 A 그대로).
- **영향 범위**: `api/sessions/claim.ts` 신규 + `api/sessions/my.ts` 신규 + `api/session.ts` ownerUserId 응답 + `lib/flow/context.tsx` (auth useEffect + ServerSessionMeta) + `app/(flow)/family-input.tsx` (PIPA 14세 분기).
- **되돌리는 방법**: FlowProvider useEffect 제거 + api/sessions/claim·my 삭제 + ownerUserId 응답 제거. 옛 비회원·회원 sessions는 user_id 있는 채로 남음 (무해).

---

## 2026-05-31: eduluck admin 설계 — admin_users 테이블 + provider 비제한 + PII 마스킹 + Google·카카오 multi-OAuth

- **선택**: (1) admin 권한 = `admin_users` 테이블 + UI CRUD (env allowlist X). (2) PII 마스킹 기본 ON + "원본 보기" 토글 (audit log mask_off). (3) PC 14컬럼+5 raw / 모바일 토글. (4) provider 비제한 (admin_users 등록만 확인 — Google·카카오 둘 다). (5) 학운 점수 cap X (raw × 100/141 정규화 그대로). (6) admin 카카오 로그인만 `account_email` scope 추가 (`requireEmail` prop).
- **대안 검토**:
  - (1) env ADMIN_EMAILS allowlist — 단순하지만 매번 Vercel env 변경. user_profiles.is_admin 컬럼 — 일반 user와 권한 섞임.
  - (2) 마스킹 강제 (검색만 풀) — 데이터 검수 어려움. 풀 노출 — 어깨너머 PII 노출 위험.
  - (3) 14컬럼 강제 — 모바일 너무 좁음. 컴팩트 강제 — 시각 비교 어려움.
  - (4) provider 'google' 강제 (직전 design) — 카카오 사용자 (hongary) 차단. eduluck 일반 사용자가 카카오라 admin도 카카오가 자연.
  - (5) cap 100 — 108점 같은 상위 통과자 정보 손실. percentile 진짜 정규화 — 시스템 전체 재설계.
  - (6) 모든 카카오 로그인 account_email 강제 — 일반 사용자(사주) 이메일 부담. 카카오 KOE205 우회 잔재 (profile_nickname 단독)를 admin만 풀어줌.
- **선택 이유**: (1) 어드민 추가/제거 UI 요구. (2) PIPA 안전조치 + 균형. (3) 모바일 가독성. (4) 사용자 의도 (hongary 카카오 로그인). (5) 정보 손실 방지 + 의도된 시스템 (1-1 통과 sample). (6) UX 분리 — admin은 이메일 필수, 일반은 부담 회피.
- **영향 범위**: `lib/admin/{auth,client,mask,useAdminMe}.ts`·`api/admin/{me,subjects,subjects/[id],admins,audit-log}.ts`·`app/admin/{_layout,index,subjects/index,admins,audit-log}.tsx`·`components/{GoogleLoginButton,KakaoLoginButton}.tsx`·`lib/hooks/useAuth.ts`·`supabase/migrations/20260531000000_admin_tables.sql`
- **되돌리는 방법**: admin 페이지·API·테이블 모두 삭제 가능 (사용자 데이터 영향 X). admin_users·admin_audit_log drop 후 마이그레이션 되돌리기. provider 강제 추가 시 lib/admin/auth.ts에 `if (provider !== 'X')` 한 줄 추가.

---

## 2026-05-31: 옛 schema 데이터 정리 (subjects 165 → 37)

- **선택**: 3차례 sessions CASCADE 삭제 — 옛 schema (unsung·shensha 누락) 11 + directions 누락 44 + dev test nickname 6 = 총 55 sessions 정리.
- **대안 검토**:
  - A. 코드 fallback만 — 모든 데이터 유지하되 화면에서 표시 가능. 옛 데이터로 인한 노이즈 영구.
  - B. **CASCADE 삭제** (선택) — 깔끔. mom test 시작 전 정리 적기.
  - C. Archive 테이블로 이동 — 복구 가능하지만 작업량 ↑.
- **선택 이유**: 칼리브레이션 sample은 `_private/calibration-samples/*.md` 박제 → DB 삭제 영향 X. 옛 schema는 학운 계산 불가 + admin 화면 노이즈. mom test 데이터 누적 시작 *전*이 정리 적기.
- **영향 범위**: subjects + sessions + interpretations + feedback_responses + pdf_preorders 모두 CASCADE 정리.
- **되돌리는 방법**: 복구 불가 (CASCADE 삭제). 단 칼리브레이션 sample은 _private에 있어서 다시 진단하면 새 데이터 생성 가능.
