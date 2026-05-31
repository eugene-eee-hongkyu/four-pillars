# decision.md — 의사결정 기록

> 새 결정이 위에 오도록 역순으로 작성한다.
> 500라인 초과 시 `.harness/archive/decision-YYYY-MM-DD.md`로 이동.
> 이전 기록: [archive/decision-2026-05-31.md](archive/decision-2026-05-31.md)

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
