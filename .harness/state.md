# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-06-12 16:49
## 마지막 업데이트: 2026-06-12 16:49
## 현재 모드: bypassPermissions

### 현재 집중

- 정밀 진단 v6.0(14섹션) + 잔존 "10 섹션" 라벨 7섹션 정합 완료. 학운 그릇 칩 vs §13 학교 sub-tier 불일치 → 부모 합 보정 포함으로 통일(A안, 코드 2파일 **미커밋**). 명리 백엔드 결정성 + 어드민 사용자 관리 풀스택 완료. **A안 커밋 + 배포 후 LLM 출력 점검 + mom test 배포 대기.**

### 이어서 할 것

1. **A안 코드 2파일 커밋** — `HagunSignerBreakdown.tsx`(Props 부모 manse 추가)·`interpret-premium.tsx:147`(부모 전달). typecheck PASS 상태, 사용자 확인 후 커밋
2. **배포 후 14섹션 LLM 출력 점검** — 테스트 사주로 Part1·Part2 전문, 새 번호(1-14) 헤더·병합 섹션·§14 액션 카드 확인
3. **mom test 친구들 배포 + 인터뷰 4문항** → admin 검수. 가이드: `eduluck/docs/mom-test/interview-guide.md`

### 막힌 것

- 없음

### 사람 판단 필요

- **아빠 부모보정 "절반 가중치" 주석 vs `+1` 구현 불일치** — `calcParentAdjust`([hagun-tier.ts:471-485](../eduluck/lib/prompts/hagun-tier.ts)) 아빠 양수 분기가 주석은 ±0.5 의도인데 코드는 엄마와 동일 +1, 음수만 0으로 막힘. 진짜 절반(+5점)으로 갈지 현행(+10·음수0) 유지할지 명리 설계 결정 필요
- mom test 친구 배포 시점·표본 구성 (가까운 친구·친구의친구·잘 모르는 어머니 분리 권장)
- 통신판매업 신고 시점 (지금 진행 권장 — mom test 병행)
- 회사 대표 유선번호 확보 (현재 임시 휴대폰 010-4195-3278)
- CSP Enforce 전환 (1주 모니터링 후)
- 정식 결제 도입 시 POST_PAYMENT_PATH B → A안 swap 검토

### 운영 자료

- **e2e 검증 playbook**: `.harness/e2e-playbook.md` — 20종 검증
- **Mixpanel funnel dashboard**: https://mixpanel.com/project/4028508/app/boards#id=11235075 — 3 funnel
- **mom test 인터뷰 가이드**: `eduluck/docs/mom-test/interview-guide.md` — 4문항 + GO/HOLD/KILL
- **사업자 정보 단일 source**: `eduluck/lib/legal/business-info.ts` — placeholder 1종(통신판매업) 남음. LegalFooter 자동 hide
- **가격 단일 source**: `eduluck/lib/legal/pricing.ts` — 정가 20,000원·사전 예약 4,000원·80% 할인. `PAYMENT_VISIBLE = false`
- **정밀 진단 구조 (v6.0, 14섹션)**: Part1 §1-§7(시작·본질·강점·약점·환경+건강·부모합·양육가이드) / Part2 §8-§14(친구선생님·흐름·조심할해·해외·전공진로·학교·어머니한마디+액션카드) + 시그니처. `PREMIUM_PROMPT_VERSION = v6.0-14sections-merge`. baseline §번호는 옛 번호 유지(텍스트 매칭) — decision.md 2026-06-12
- **"더 자세히 보기"(deep-dive) 분량**: 단일 섹션 60-100문장 / 5500-8000자 / A4 2-3p (`interpret-deep.ts` 72-74·139·113행)
- **학운 sub-tier 산출**: `calculateFinalTierV2` = hagunScore + 부모보정(엄마 -10/0/+10, 아빠 0/+10, 합 -10~+20, 10점 계단) → `scoreToSubTier`. **칩·§13·history 모두 부모 포함으로 통일(A안)**. tier→학교는 `tier-schools.ts` 단일 source
- **명리 백엔드 결정성 모듈**: §13 hagun-tier · §14 critical-year · §11 peer-profile · §12 academy-fit · §15 abroad-score (구 번호 기준). 공통 `lib/manse/academic-context.ts`. 점수·티어 영향 0 별도 레이어
- **§15 해외운 정책**: abroadScore 10시그널 가중합(점수식 고정, 5 anchor 정합). 등급 약/보통/강/매우 강. **국가명 ✗ → 용신 오행 방위(참고)**. §17 해외대학명 ✗ → 유학 권유. decision.md 2026-06-03
- **어드민 사용자 관리**: `/admin/users`(카카오 리스트·재진단 ON/OFF) + `/admin/users/[userId]`(본 사주 조회·삭제). `redo_grants` + `/api/me/redo`. 첫 화면 카드: 권한자에게 "다시 정밀 진단"(beginRedo) + "삭제"(DELETE /api/sessions/[id], 본인 소유·cascade)
- **결제 PG 결정**: 포트원(PG 라우터) + 토스페이먼츠(메인 PG)
- **paywall 정책**: 비회원 자녀 1·영역 1·Part2 진입 차단 / 회원 자녀 5·영역 3. server cap: device_id 403 + claim cap 5
- **admin 진입**: https://luck.z21labs.world/admin (Google 또는 카카오 + admin_users). super-admin: eugene.eee@iskra.world · hongary@naver.com
- **DB(Supabase eduluck `hqtletafqlwphhakoyrm`)**: 카카오 회원 3명. `redo_grants` 테이블. admin_audit_log action 확장(list_users·grant_redo·revoke_redo·view_user·delete_session)
- **localStorage owner ship**: Phase 1 user_id + Phase 2 claim 자동 + 로그아웃 STORAGE_KEY 삭제. 로그인 시 mergeServerHistory(서버 authoritative — 삭제 즉시 반영)
- **SDK 버전**: expo 52.0.49 · expo-router 4.0.22 · react 18.3.1 · react-native 0.76.9 · supabase-js 2.104.1 exact lock

### 백로그 요약

- 대기 중: 7개
- 최근 추가: 2026-06-03 — §11·§12·§15 백엔드 결정성 가중치 calibration (mom test 후)

### 진행 상황

- [x] sajutalk MVP + eduluck Phase 0-9 + 정밀 진단 v5 production 배포
- [x] 학운 시스템 N=9 97.8/100 + 30 sub-tier + 방향성 11 + 적성 점수 5 모듈
- [x] V11-V25 calibration + selftest 12/12 + Haiku 4.5 다운그레이드
- [x] 가족 공유 풀스택 + 정밀 진단 Part1/2 분리
- [x] 보안 audit Round 1·2 + e2e playbook 20종
- [x] 카카오 로그인 + paywall + server cap defense + 사업자 등록 + PG 심사 5종
- [x] localStorage PII Phase 1·2 + cross-PC 본문 복원
- [x] Part2 비회원 paywall + 회원 cap + 가격 정책 + PaywallModal 디자인
- [x] redirect UX + 랜딩 hero 카피 톤 + 결제 CTA 숨김 (PAYMENT_VISIBLE flag)
- [x] **§13 학운 phase v2 (`3a9470a`)** ⭐ — 자평/억부 컨텍스트. 점수·티어 0 영향
- [x] **어드민 카카오 사용자 리스트 + 선택형 재진단 권한 (`e81708d`·`7841359`)** ⭐
- [x] **어드민 사용자 상세 — 본 사주 조회·삭제 (`a9e73bd`·`2dd439d`·`b9fb94c`)** ⭐ — Vercel params 500 fix + prod e2e
- [x] **어드민 삭제 홈 history 반영 fix (`a2e6ff1`)** — mergeServerHistory 순수함수
- [x] **§14 조심할해 v2 (`ca59ac8`)** ⭐ — 충 용신/기신 동적 + 형·파·양인·백호. 테스트 8개
- [x] **§11 친구·§12 학원 백엔드 결정성 + 일관성 (`d1c5922`)** ⭐ — peer-profile·academy-fit. 테스트 7개
- [x] **§15 해외운 국가 제거 + 용신 방위 + §17 유학 권유 (`6155b62`·`576065a`)** ⭐ — 5 anchor 용신조건부 반증
- [x] **첫 화면 카드 "삭제" 버튼 (재진단 허용자) (`da482e9`)** ⭐ — DELETE /api/sessions/[id] + prod e2e
- [x] **정밀 진단 20 → 14 섹션 통합 (`5b20e8d`)** ⭐ — Part1 7·Part2 7. 읽기 피로 감소, 점수 영향 0, v6.0
- [x] **잔존 "10 섹션"·"20개 영역" 라벨 7섹션 정합 (`8d89c35`)** — 화면·페이월·PDF·프롬프트·주석 10 files
- [ ] **학운 그릇 칩 부모보정 통일 (A안)** — 코드 2파일 작성·typecheck PASS, **미커밋**
- [-] sajutalk 프로젝트 hold — eduluck mom test 후 재개 여부 결정
- [ ] 아빠 부모보정 주석 vs 구현 불일치 정리 (설계 결정 후)
- [ ] 배포 후 14섹션 LLM 출력 점검 (헤더 번호·병합 내용·액션 카드)
- [ ] 통신판매업 신고 (정부24 또는 강남구청, 3-7영업일)
- [ ] 포트원 PG 사전 점검 재실행 → 가맹점 심사 신청
- [ ] Mom test 친구들 배포 + 인터뷰 4문항 → GO/HOLD/KILL 판정
- [ ] §11·§12·§15 백엔드 결정성 LLM 실출력 모순·품질 점검
- [ ] mom test 결과 → 정가 confirm → 포트원 + 토스페이먼츠 결제 페이지 + POST_PAYMENT_PATH B→A
- [ ] 방향성 시스템 정비 별도 세션 — score.ts·categoryScores·체육 명명·DirectionKey global 통일
- [ ] §13 학운 phase Phase B (학업 신살·합충형해 타격 정밀)
- [ ] CSP Report-Only → Enforce 전환
- [ ] LLM prompt XML wrapping (mom test 후 calibration 동반)
- [ ] 회사 대표 유선번호 확보 → BUSINESS_INFO phone 교체
- [ ] admin audit log retention 정책 (90일·분기 archive)
