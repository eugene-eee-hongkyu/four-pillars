# eduluck A-3b v1 — 전체 화면 디자인 시스템 적용

> 정책 v16 기준. 1차 독자: Eugene (외주 기획자). A-3a v1 / DESIGN v1 확정 후 작성.
> 페어 산출물: `docs/design/DESIGN_v1.1.md` (보강된 디자인 시스템)

---

## A 트랙 요약 블록

> **A-0 핵심 가설:** 학생(초·중·고) 자녀 둔 30~45세 어머니가 무료 간이 → 정밀 진단 첫 결제까지 진행한다.
>
> **A-3a 결정:** Warm Heritage (한지 미색 + 청회 + 골드) / Pretendard 본문 + Noto Serif KR 한자 / Stitch 도구
>
> **A-3b 작업:** 화면 4 검증된 시스템을 화면 1·2·3·5·6·7·8·9·10·11에 일괄 적용. Stitch one-shot generation.

---

## 1. 11개 화면 적용 결과 (요약 평가)

| # | 화면 | 일관성 | 핵심 spec 충족 | 이슈 |
|---|---|---|---|---|
| 1 | 랜딩 | ✅ GOOD | ✅ | 히어로 이미지 generic |
| 2 | 자녀 기본 정보 | ✅ GOOD | ✅ | 깔끔 |
| 3 | 자녀 사주 입력 | ⚠️ FAIR | ✅ | **영문 라벨 (BIRTH DATE·TIME·LOCATION)** / 시간 모름 처리 방식 다름 |
| 4 | 자녀 만세력 (A-3a) | ✅ EXCELLENT | ✅ | 기준 |
| 5 ★ | 무료 진단 결과 | ✅ EXCELLENT | ✅ | "THE HERITAGE LABEL" 영문 라벨 / ⚙️ 설정 아이콘 잉여 |
| 6 | 정밀 가치 안내 | ⚠️ FAIR | ✅ | **영문 라벨 3개 (PREMIUM ANALYSIS·HERITAGE·ANALYSIS RESULT)** |
| 7 | 회원가입 | ✅ GOOD | ✅ | 깔끔 |
| 8 ★ | Mock 결제 | ⚠️ FAIR | ⚠️ | **카드 번호 마스킹** (**** **** **** 1234) — spec 위반 (완전 표시 prefilled 필요) |
| 9 | 어머니 사주 입력 | ⚠️ FAIR | ⚠️ | **시간 모름 체크박스 누락** / 한글 라벨 (화면 3과 충돌) |
| 10 | 어머니 만세력 | ⚠️ POOR | ⚠️ | **사주팔자 표 패턴이 화면 4와 다름** (dense info) / **"AI 분석 완료" 배지** spec 위반 |
| 11 ★ | 정밀 진단 결과 | ⚠️ FAIR | ❌ | **mom test 2차 설문 질문이 우리 spec과 완전 다름** (MVP 핵심 측정 실패) |

**총평:** 시각 시스템 일관성 양호 (7/11 EXCELLENT/GOOD). 단 **MVP 핵심 검증 화면 3개(★) 중 화면 8·11에 spec 위반 발견 — B-1에서 수정 필수**.

---

## 2. 시스템 일관성 검증

### 잘 작동한 토큰·패턴

| 항목 | 결과 |
|---|---|
| 컬러 시스템 (한지 미색 + 청회 + 골드) | ✅ 11개 화면 모두 일관 |
| 카드 패턴 (white bg + outline-warm border) | ✅ 일관 |
| sticky CTA (bottom fixed, primary bg) | ✅ 일관 (단 pill vs rounded rectangle 미세 차이) |
| 헤딩 hierarchy (display·headline·body) | ✅ 일관 |
| 사주 용어 highlight (인성·문창귀인 등 secondary 골드) | ✅ 화면 5·10·11 일관 |
| 본문 가독성 (line-height 1.7~1.8) | ✅ 화면 5·11 우수 |

### 일관성 깨진 패턴

| 항목 | 이슈 |
|---|---|
| 한글·영문 라벨 혼용 | 화면 3·5·6은 영문, 화면 2·7·9·11은 한글 — **통일 필요** |
| 사주팔자 표 패턴 | 화면 4 = 한자만 / 화면 10 = 한자+한글음+십성 dense — **둘 중 통일 필요** |
| 우측 상단 ⚙️ 설정 아이콘 | 화면 5·6·8 자동 추가 (A-2 spec 없음) — **제거 필요** |
| 용어 가이드 처리 | 화면 4 = 펼침 토글 / 화면 10 = 풀 노출 — **통일 필요** |

---

## 3. 발견 이슈 + 수정 우선순위

### 🔴 P0 (B-1 빌드 시 필수 수정)

**1. mom test 2차 설문 질문 완전 다름 (화면 11)**
- 현재: "현재 아이의 학습 속도에 조급함을 느끼시나요?" + "아이의 관심사를 충분히 지지하고 있다고 생각하시나요?"
- spec: "정밀 진단이 결제할 만한 가치였나요?" + "실제로 결제했다면 하시겠나요?"
- 영향: **MVP 핵심 측정 지표 4번(결제 의향 자기 보고) forcing function 실패**
- 수정: B-1에서 두 질문 텍스트만 교체

**2. 카드 번호 마스킹 (화면 8)**
- 현재: `**** **** **** 1234`
- spec: `1234-5678-9012-3456` (완전 prefilled placeholder)
- 영향: prefilled 의도 = 카드 입력 friction을 noise로 분리해 순수 결제 의향 측정. 마스킹되면 placeholder 느낌 강해져 "실제 결제" 시뮬레이션 약화
- 수정: B-1에서 카드 번호 placeholder 교체

**3. 사주팔자 표 패턴 불일치 (화면 4 vs 10)**
- 현재: 화면 4 = 한자(+오행 색) / 화면 10 = 한자+한글음+십성 통합
- spec: 화면 4 패턴 채택 (한자만 + 십성은 별도 카드)
- 영향: saju 도메인 핵심 컴포넌트 일관성 위반. 빌드 시 컴포넌트 재사용 불가
- 수정: B-1에서 화면 10 사주팔자 표를 화면 4 컴포넌트로 통일

**4. "AI 분석 완료" 배지 (화면 10)**
- 현재: 어머니-자녀 관계 카드에 "AI 분석 완료" 배지 노출
- spec: DESIGN.md §8 — "AI" 단어 노출 자제, 브랜드 = "사주 종합 학운 진단"
- 수정: 배지 텍스트 "분석 완료" 또는 제거

### 🟡 P1 (수정 권장, B-1 빌드 또는 A-3b iteration)

**5. 영문 라벨 산발 사용**
- 화면 3: BIRTH DATE / BIRTH TIME / BIRTH LOCATION → 생년월일 / 태어난 시간 / 태어난 지역 (화면 9 패턴 채택)
- 화면 5: THE HERITAGE LABEL → 제거 또는 한글 ("이번 진단")
- 화면 6: PREMIUM ANALYSIS / HERITAGE / ANALYSIS RESULT → 한글 ("정밀 분석" 등)

**6. 우측 상단 ⚙️ 설정 아이콘**
- 화면 5·6·8에 자동 추가 — A-2 spec 없음, single-flow funnel
- 수정: 모든 화면에서 제거

**7. 시간 모름 체크박스 (화면 9)**
- 현재: 어머니 사주에 시간 모름 옵션 없음 (안내만)
- spec: 화면 3과 동일 패턴 (체크박스 + 모달)
- 수정: B-1에서 추가

### 🟢 P2 (옵션, v1.5 이후)

**8. 학년대별 가이드 4구간 vs 3구간 (화면 11)**
- 현재: 초등·중등·고등 3구간
- spec: 초저·초고·중·고 4구간
- 영향: 미세. 3구간도 합리적. 모바일 readability 측면에서 3구간이 더 깔끔
- 결정: **3구간 수용** (Stitch 패턴 채택, spec 완화)

**9. 자시 기본값 vs 시(時)주 비움 (화면 3)**
- 현재: "출생 시간 모를 경우 자시(23:30~01:29) 기준 산출"
- spec: 시(時)주 비우고 진단 + 면책
- 영향: 명리 이론에서 두 방식 모두 유효. 어느 게 정확도 더 높은지 명리 전문가 확인 필요
- 결정: **B-1 진입 전 결정 필요** (Eugene·명리 전문가)

**10. 학습 흐름 차트 시각화 (화면 5)**
- 현재: 부드러운 곡선 + 4 데이터 포인트 (초저·초고·중·고)
- 좋음. 변경 없음.

### 🔵 보강 (의외 발견 — DESIGN.md v1.1 반영)

**11. 헤딩 명조 (notoSerif) 시각 결과 우수**
- 현재 Stitch: 헤딩 = notoSerif 600-700
- 원래 spec v1: 헤딩 = Pretendard 800
- 실제 결과: notoSerif 헤딩이 saju 정통성 + 학구적 톤 매우 잘 표현
- Eugene 피드백: "이 폰트가 좋았다" 확인
- **DESIGN.md v1.1: 헤딩 = Noto Serif KR 600-700으로 spec 업데이트**

**12. 결제 완료 헤더 패턴 (화면 9)**
- secondary container bg + ✓ icon + headline-md
- 매우 좋은 success state 표현
- **DESIGN.md v1.1에 success header 컴포넌트 spec 추가**

**13. 가격 emphasis 패턴 (화면 8·6)**
- secondary container 배지 + secondary text
- 매우 효과적
- **DESIGN.md v1.1에 price emphasis 컴포넌트 spec 추가**

**14. 사주 용어 highlight (화면 5·10·11)**
- 사주 키워드(인성·문창귀인·도화·역마살 등)를 secondary 골드 텍스트로 highlight
- Eugene 톤 마커("사주 용어 + 즉시 평이한 풀이")와 정합
- **DESIGN.md v1.1에 inline keyword highlight 컴포넌트 spec 추가**

---

## 4. [SO 결정] 결과 (A-3b 회귀·확정 사항)

| # | 결정 | 결과 |
|---|---|---|
| 1 | 헤딩 폰트 | **Noto Serif KR 600-700** (Pretendard 800 → 변경, Stitch 결과 + Eugene 선호 반영) |
| 2 | 본문 폰트 | Pretendard 400 (변경 없음) |
| 3 | 한자 폰트 | Noto Serif KR (변경 없음) |
| 4 | 학년대별 가이드 구간 | **3구간 (초·중·고)** 수용 (4구간 → 3구간, Stitch 결과 채택) |
| 5 | 사주팔자 표 패턴 | **화면 4 패턴 통일** (화면 10도 동일 적용) |
| 6 | 카드 번호 표시 방식 | **완전 prefilled placeholder** (마스킹 X) |
| 7 | mom test 2차 설문 | **spec대로 결제 가치 + 결제 의향 2문항** (Stitch 자동 생성 무시) |
| 8 | "AI" 단어 노출 | 모든 화면 제거 (배지·라벨 포함) |
| 9 | ⚙️ 설정 아이콘 | 모든 화면 제거 |
| 10 | 영문 라벨 사용 | 모든 화면 한글 통일 |
| 11 | 시간 모름 체크박스 | 화면 3·9 모두 적용 |
| 12 | 자시 기본값 vs 시주 비움 | **B-1 진입 전 결정 보류** (Eugene·명리 전문가 검토) |

---

## 5. Kill / Go / Hold 판정

**조건부 Go** — B-1 진입. 단 P0 이슈 4종 B-1 빌드 단계에서 필수 수정.

근거 3줄:
1. 시각 시스템 일관성 검증 완료 (7/11 화면 양호). 컬러·폰트·spacing·컴포넌트 토큰 모두 작동.
2. P0 이슈 4종 모두 **코드 텍스트·컴포넌트 재사용으로 B-1 단계에서 수동 처리 가능** — 재 Stitch generation 불필요.
3. DESIGN.md v1.1 보강 사항 (헤딩 폰트·success header·가격 emphasis·keyword highlight) 명시로 B-1 빌드 가이드 완비.

**Hold 가능성 (선택):** Eugene이 P0 이슈를 Stitch에서 미리 정리하고 싶으면 화면 8·10·11 단독 iteration (inline comment 또는 chat 한 줄). 단 B-1에서도 처리 가능하므로 시간 효율 측면에서 **즉시 B-1 진입 권장**.

---

## Claude의 적대적 압박 — Kill할 이유 세 가지

1. **MVP 핵심 검증 화면 3개 중 2개에 spec 위반 발견** — mom test 2차 설문(화면 11) 잘못된 질문, 카드 번호 마스킹(화면 8) 모두 measurement forcing function 직격탄. B-1에서 수정한다고 했지만 **B-1 빌드 시 다른 우선순위(라우팅·API·DB)에 밀려 누락 가능성**. B-1 SPEC.md 작성 시 P0 이슈 4종을 명시적 checklist 항목으로 박아야 함.

2. **사주팔자 표 두 패턴 발견은 우리 spec의 underspecification 신호** — 화면 4·10이 다르게 generation됨 = DESIGN.md v1 §7 saju 도메인 컴포넌트 spec이 충분히 명확하지 않았다는 뜻. v1.1에서 사주팔자 표 컴포넌트 spec 상세화 + 화면 10 사용 패턴 명시 필수. 그렇지 않으면 B-1 빌드에서 또 두 패턴 나올 위험.

3. **외부 검증 (학부모 mom test) 여전히 부재** — A-3a Kill 이유 #1 그대로 carry. 변형 C(Warm Heritage) 단독 결정 + 11개 화면 시각 검증을 학부모 5명에게 보여주지 않음. 헤딩 명조가 정통성 신호로 작동할지 vs "고리타분" 신호로 작동할지 검증 안 됨. **v1 출시 첫 100명 mom test 데이터로 forcing — A-3 회귀 가능성 명시적 acknowledge 필요**.

---

## 후속 메모 (B-1 입력용)

### B-1 SPEC.md 작성 시 명시할 P0 checklist

```markdown
## P0 — A-3b 빌드 시 필수 수정 사항

[ ] 화면 8: 카드 번호 prefilled placeholder = "1234-5678-9012-3456" (마스킹 X)
[ ] 화면 11: mom test 2차 설문 질문 교체
    - Q1: "정밀 진단이 결제할 만한 가치였나요?"
    - Q2: "실제로 결제했다면 하시겠나요?"
[ ] 화면 10: 사주팔자 표 = 화면 4 컴포넌트 재사용 (한자만 + 십성 별도 카드)
[ ] 화면 10: "AI 분석 완료" 배지 텍스트 변경 → "분석 완료" 또는 제거
[ ] 화면 3·5·6: 영문 라벨 모두 한글로
[ ] 모든 화면: 우측 상단 ⚙️ 설정 아이콘 제거
[ ] 화면 9: 시간 모름 체크박스 추가 (화면 3 동일 패턴)
```

### B-1 진입 전 결정 필요

- **자시 기본값 vs 시(時)주 비움** — Eugene이 명리 전문가 또는 saju 도서 확인 후 결정. MVP 시작 전.

### Handoff bundle 정리

B-1 빌드 입력:
- `docs/design/DESIGN_v1.1.md` (보강된 시스템)
- `docs/plan/A-2_v2.md` (화면 spec 11종)
- `docs/plan/A-3a_v1.md` (디자인 결정 컨텍스트)
- `docs/plan/A-3b_v1.md` (P0 checklist + 보강 사항)
- Stitch zip (`stitch_eduluck_saju_interface_concepts.zip`) — 11개 screen.png + code.html (Tailwind reference)

### B-1 빌드 가이드 (CLAUDE.md) 핵심

```markdown
- 스택: React Native (Expo Router) + Vercel(web) + EAS Build
- 폰트 로딩: Pretendard (본문) + Noto Serif KR (한자·헤딩 — v1.1 업데이트)
- saju 도메인 컴포넌트는 화면 4 패턴 단일 진실 (DESIGN v1.1 §7)
- AI prompt 톤 마커: Eugene 샘플 reading 참조 (A-1 v4 §후속 메모)
- 만세력 계산 엔진: open-source saju lib 또는 자체 구현
- AI 호출: 3 prompt (간이/mini 관계/정밀)
- mock 결제: 게이트웨이 호출 없음, paid 상태만 갱신
- 측정 지표: P0 checklist 5종 forcing function 박힘
```

### 외부 검증 권장 (v1 출시 전·후)

**출시 전 (옵션):**
- 학부모 5명에게 화면 4·5·8·10·11 prototype 보여주기
- 만세력 정보 부담 측정 (체류 5초·10초·30초)
- 헤딩 명조 톤 = 정통성 신호 vs 고리타분 신호 검증

**출시 후 (필수):**
- 첫 100명 — P1 mom test 1차 점수 평균
- 첫 100명 — P3 mom test 2차 + 결제 의향 점수
- 평균 3점 미만 → A-3a 회귀 (톤 재선택 또는 정보량 축소)

---

## 변경 이력

- **v1** (2026-05-18) — eduluck 최초 A-3b. Stitch에서 9개 신규 화면 일괄 generation (화면 1·2·3·5·6·7·8·9·10·11). 11개 화면 시각·코드 분석 완료. 시각 시스템 일관성 양호 (7/11). P0 이슈 4종 + P1 이슈 3종 + P2 이슈 3종 발견. DESIGN.md v1 → v1.1 보강 사항 4종 명시 (헤딩 폰트 변경·success header·가격 emphasis·keyword highlight). **조건부 Go — B-1 진입, P0 이슈 빌드 단계 수정 강제**. [SO 결정] 12개 확정. Kill 이유 3개 — measurement forcing function 누락 위험·spec underspecification·외부 검증 부재.
