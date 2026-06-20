# state.md — 현재 상태 요약

> `/worklog` 명령으로 갱신한다.
> 1페이지 이내. 스크롤 없이 읽을 수 있는 길이를 유지한다.
> 추측 금지. 사실만 기록한다.

---

## 마지막 실행: 2026-06-20 16:03
## 마지막 업데이트: 2026-06-20 16:03
## 현재 모드: bypassPermissions

### 현재 집중

- 어드민 무료공개 설정 + 피드백 조회 + 가족 만세력 보기 링크 + 성능/UI 개선 일단락. **다음: 배포 후 14섹션 LLM 출력 점검 + mom test 배포.**

### 이어서 할 것

1. **배포 후 14섹션 LLM 출력 점검** — 테스트 사주로 Part1·Part2 전문, 새 번호(1-14) 헤더·병합 섹션·§14 액션 카드 확인
2. **mom test 친구들 배포 + 인터뷰 4문항** → admin 검수(이제 /admin/feedback 에서 응답 조회 가능). 가이드: `eduluck/docs/mom-test/interview-guide.md`
3. **통신판매업 신고** + **포트원 PG 가맹점 심사 신청**

### 막힌 것

- 없음

### 사람 판단 필요

- **아빠 부모보정 "절반 가중치" 주석 vs `+1` 구현 불일치** — `calcParentAdjust`([hagun-tier.ts:471-485](../eduluck/lib/prompts/hagun-tier.ts)) 아빠 양수 분기 주석은 ±0.5 의도인데 코드는 엄마와 동일 +1, 음수만 0. 진짜 절반(+5점)으로 갈지 현행 유지할지 명리 설계 결정
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
- **정밀 진단 구조 (v6.0, 14섹션)**: Part1 §1-§7 / Part2 §8-§14 + 시그니처. `PREMIUM_PROMPT_VERSION = v6.0-14sections-merge`. baseline §번호 옛 번호 유지(텍스트 매칭) — decision.md 2026-06-12
- **가족 만세력 화면**: `app/(flow)/child-manse.tsx` — 자녀+부모 PalcaTable·오행·대운 등. 정방향 흐름(진단 전) "정밀 진단 받기" / 진단 완료 재방문(diagnosisDone) "정밀 학운 보기" + 공유 + 피드백. interpret-premium 하단 "📜 가족 만세력 보기" 버튼(part2Done)에서 진입
- **"더 자세히 보기"(deep-dive)**: 단일 섹션 60-100문장 / 5500-8000자. DEEP_SECTIONS는 `lib/prompts/deep-sections.ts`(순수 데이터 leaf — 클라 번들 누수 차단), 빌더는 `interpret-deep.ts`
- **어드민 무료공개 설정**: `/admin/settings` — deep-dive 14영역 무료정책. `app_config.deep_section_access`(jsonb: mode `per_section`|`count`, freeSections[], freeCount). count = 무작위 N개(sessionId 결정적 셔플 client·server 일치), 기본 전체 무료. GET/PUT `/api/admin/config`(audit `update_config`) + 공개 GET `/api/config/deep-sections`. 서버 게이트 interpret-deep 402(본 섹션 재열람 허용)
- **어드민 피드백 조회**: `/admin/feedback` — feedback_responses(정량6+정성5+메타) 최신 300건. GET `/api/admin/feedback`(service_role). 읽기 전용(audit 미기록)
- **어드민 공통 UI/perf**: 공유 `AdminNav`(탭: 진단·사용자·피드백·설정 / super: 어드민·감사로그). 선택탭 배경+굵게, 헤더 흰바+그림자. 신원 세션 캐싱(`fetchAdminMe` 토큰키) — 보안 영향 0(데이터 API verifyAdminRequest 매 요청 유지)
- **학운 sub-tier 산출**: `calculateFinalTierV2` = hagunScore + 부모보정(엄마 -10/0/+10, 아빠 0/+10, 합 -10..+20, 10점 계단) → `scoreToSubTier`. 칩·§13·history 모두 부모 포함(A안). tier→학교는 `tier-schools.ts`
- **명리 백엔드 결정성 모듈**: §13 hagun-tier · §14 critical-year · §11 peer-profile · §12 academy-fit · §15 abroad-score. 공통 `lib/manse/academic-context.ts`. 점수·티어 영향 0
- **§15 해외운 정책**: 국가명 ✗ → 용신 방위. §17 해외대학명 ✗ → 유학 권유. decision.md 2026-06-03
- **paywall 정책**: 비회원 자녀 1·Part2 진입 차단 / 회원 자녀 5. server cap: device_id 403 + claim cap 5. **deep-dive 영역 게이트는 어드민 무료공개 설정(app_config)으로 대체**
- **재진단/삭제 버튼(홈)**: `/api/me/redo`(getUser+redo_grants) 권한 확정 후에만 노출 — 정확성 위해 캐시 안 함(decision.md 2026-06-20). 첫 진입 지연은 서버 왕복 탓
- **admin 진입**: https://luck.z21labs.world/admin (Google 또는 카카오 + admin_users). super-admin: eugene.eee@iskra.world · hongary@naver.com
- **DB(Supabase eduluck `hqtletafqlwphhakoyrm`)**: 카카오 회원 3명. `redo_grants` + `app_config` + `feedback_responses` 테이블. admin_audit_log action 확장(…·delete_session·`update_config`)
- **localStorage owner ship**: Phase 1 user_id + Phase 2 claim 자동 + 로그아웃 STORAGE_KEY 삭제. 로그인 시 mergeServerHistory(서버 authoritative)
- **SDK 버전**: expo 52.0.49 · expo-router 4.0.22 · react 18.3.1 · react-native 0.76.9 · supabase-js 2.104.1 exact lock

### 백로그 요약

- 대기 중: 7개
- 최근 추가: 2026-06-03 — §11·§12·§15 백엔드 결정성 가중치 calibration (mom test 후)

### 진행 상황

- [x] sajutalk MVP + eduluck Phase 0-9 + 정밀 진단 v5 production 배포
- [x] 학운 시스템 N=9 97.8/100 + 30 sub-tier + 방향성 11 + 적성 점수 5 모듈
- [x] V11-V25 calibration + selftest 12/12 + Haiku 4.5 다운그레이드
- [x] 가족 공유 풀스택 + 정밀 진단 Part1/2 분리 + 보안 audit Round 1·2 + e2e playbook 20종
- [x] 카카오 로그인 + paywall + server cap defense + 사업자 등록 + PG 심사 5종
- [x] localStorage PII Phase 1·2 + cross-PC 본문 복원 + Part2 paywall + 가격 정책
- [x] redirect UX + 랜딩 hero 카피 톤 + 결제 CTA 숨김 (PAYMENT_VISIBLE flag)
- [x] **§13 학운 phase v2 (`3a9470a`)** ⭐ / **§14 조심할해 v2 (`ca59ac8`)** ⭐ / **§11·§12 (`d1c5922`)** ⭐ / **§15 해외운 (`6155b62`·`576065a`)** ⭐
- [x] **어드민 카카오 사용자 리스트·재진단 권한·상세 조회·삭제 (`e81708d`·`7841359`·`a9e73bd`·`2dd439d`·`b9fb94c`)** ⭐
- [x] **첫 화면 카드 "삭제" 버튼 (`da482e9`)** ⭐ — DELETE /api/sessions/[id] + prod e2e
- [x] **정밀 진단 20 → 14 섹션 통합 (`5b20e8d`)** ⭐ + 잔존 라벨 정합 (`8d89c35`) + 학운 칩 부모보정 통일 A안 (`e021205`)
- [x] **어드민 상세진단 무료공개 설정 (`4aa8610`·`79f9dde`)** ⭐ — 모드2종(무작위N·영역별), app_config 마이그레이션, vitest 6/6
- [x] **어드민 공유 네비·선택탭 강조·헤더 프레임 (`7f79132`·`06e08fa`) + 신원 세션 캐싱·번들 누수 차단 (`608dfa4`·`cea36b3`)**
- [x] **정밀진단 → 가족 만세력 보기 링크 + 만세력 하단 액션 (`e44a175`)** ⭐
- [x] **어드민 3분 피드백 조회 `/admin/feedback` (`81c32f6`)** ⭐
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