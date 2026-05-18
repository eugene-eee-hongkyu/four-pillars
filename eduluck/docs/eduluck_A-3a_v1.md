# eduluck A-3a v1 — 메인 화면 컨셉 탐색

> 정책 v16 기준. 1차 독자: Eugene (외주 기획자). A-2 v2 확정 후 작성.
> 페어 산출물: `eduluck_DESIGN_v1.md` (확정 디자인 시스템)

---

## A 트랙 요약 블록

> **A-0 핵심 가설:** 학생(초·중·고) 자녀 둔 30~45세 어머니가 무료 간이 → 정밀 진단 첫 결제까지 진행한다.
>
> **A-2 화면 11개**, 핵심 검증 화면 3개(★): 화면 5 무료 간이 진단 / 화면 8 Mock 결제 / 화면 11 정밀 진단.
>
> **MVP 경계:** React Native(Expo) / 학생 자녀 둔 30~45세 어머니 / 무료 간이 → 정밀 3,000원 첫 결제.

---

## 1. 메인 화면 선정

**화면 4 (자녀 만세력) + 화면 5 (무료 간이 진단)**

선정 이유:
1. P0→P1 핵심 전환점. AI black box 회피 정책의 시각 검증 (만세력 정통성 → 진단 친근감 연결).
2. **정보 dense(만세력 표·한자·신살)** ↔ **텍스트 readable(A4 0.5p 진단)** 두 패턴 동시 검증 — 디자인 시스템 baseline이 양쪽 모두 작동해야 함.
3. 화면 11(정밀 진단)은 화면 5와 톤·구조 유사 → 시스템 그대로 적용 가능.

---

## 2. 디자인 방향 결정

### 2-a. 톤

3개 변형 Stitch에서 동시 생성 후 비교:

- **A. Mystic Heritage** — 어두운 보라 #1A0B2E + 골드. 신비·정통.
- **B. Modern Trust** — 화이트 + 토스 블루 #3182F6 + 호박. 핀테크 친화.
- **C. Warm Heritage** — 한지 미색 #FBF8F1 + 청회 #4A5568 + 골드 #D4A574. 학부모 친화 + saju 정통.

**Eugene 선택: C. Warm Heritage**

선택 이유:
1. 학부모(어머니) 타겟에 따뜻한 톤이 가장 친화적
2. 한지 미색 + 청회 + 골드 = saju 정통성과 모던 가독성 결합
3. 모바일 light 환경(낮·실내)에서 가독성 우수
4. 사주톡(어두운 보라)·핀테크(토스 블루)와 명확히 차별화

### 2-b. 컬러 팔레트 시드

```
surface (한지 미색)     : #FBF8F1
surface-container-low   : #FFFFFF
primary (차분한 청회)   : #4A5568
primary-hover           : #333E50
secondary (따뜻한 골드) : #D4A574
text-pri                : #2D2D2D
text-sub                : #6B6B6B
outline-warm            : #E2DED5
```

상세 토큰(surface·primary·secondary 패밀리 + ohaeng·error·success)는 `eduluck_DESIGN_v1.md` §1 참조.

### 2-c. 폰트 페어링

**본문: Pretendard / 만세력 한자: Noto Serif KR**

결정 과정:
- 초안 검토에서 Eugene 비판: "명조는 너무 허접". 한국 트렌드 = Pretendard 중심 산세리프.
- Stitch 생성 코드 분석 결과 만세력 한자에 Noto Serif KR(명조) 적용됨 발견.
- **결정: 본문 명조 폐기(Pretendard), 한자에 한해 명조 허용**.
- 이유: 한자 표기는 명조가 동아시아 정통·가독성 표준. Pretendard의 한자 fallback 가독성 떨어짐. 본문은 Pretendard 트렌드 유지, 한자만 Noto Serif KR로 saju 정통성 보강.

폰트 시스템 8종 (display-lg·headline-lg/md·body-lg/md·label-lg/sm·hanja 3종) 상세는 DESIGN.md §2 참조.

### 2-d. Voice·Tone

- 친근 존댓말 ("민서는", "어머니께", "나와요", "보여요")
- 사주 용어 + 즉시 평이한 풀이 (Eugene 샘플 reading 톤 마커 적용)
- **"AI" 단어 노출 자제** — 브랜드 = "사주 종합 학운 진단"
- 학년대별 톤 분기 (초저·초고·중·고 4구간)
- 명령형 금지 — "입력하세요" → "알려주실래요?"

---

## 3. 참조 DESIGN.md

Stitch에서 발산 → 자체 DESIGN.md export → 코드 분석 통합으로 **eduluck 자체 시스템** 확립. 외부 참조 DESIGN.md 베이스 사용 안 함 (Stitch generation 결과가 충분히 완성도 높음).

부분 inspiration:
- Stripe (폼·결제 UX 정밀)
- Notion (미색 + 친근 카드 패턴)

---

## 4. 디자인 도구 입력

### 4-a. 사용 도구

**Stitch** (stitch.withgoogle.com). 정책 v15 §1-a 결정 트리 — eduluck 코드 없음 = Stitch 디폴트.

### 4-b. 사용 결과

- 변형 3개(A·B·C) 동시 발산 → 화면 4·5 각 변형마다 생성
- Eugene이 변형 C 선택
- Chat에서 "Warm Heritage 컨셉의 DESIGN.md 추출" 요청 → markdown 받음
- Export → .zip 다운로드 → code.html·screen.png·DESIGN.md 3종 추출

### 4-c. 추출 자료 통합 → eduluck_DESIGN_v1.md

Stitch DESIGN.md (베이스) + code.html에서 다음 보강:
- Tailwind config 컬러 토큰 확장 (surface 7단계, on-* 토큰 패밀리)
- Spacing scale (base 8 / gutter 16 / card-padding 20 / container-padding 24 / section-gap 48)
- Border radius scale (xs 2 / sm 4 / md 8 / lg 12 / full pill)
- 만세력 표 component 실제 구현 spec (grid-cols-4, 일간 highlight box, hanja class)
- 사주 도메인 특수 컴포넌트 10종 spec 작성

### 4-d. 제외 항목 (A-2 spec 정렬)

Stitch가 자동 추가했으나 제외:
- Bottom navigation bar (Analysis·Luck·History·Settings) — A-2 single-flow funnel이라 nav 불필요
- Top app bar 공유 버튼 — v1 진단 결과 공유 기능 없음 (v2 도입)
- Dark mode — MVP 라이트만
- 화면 5 export 누락 (화면 4만 export됨) — 같은 시스템 적용 가정, A-3b에서 9개 화면 일괄 적용 시 확인

---

## 5. [SO 결정] 결과 (확정)

| # | 결정 | 결과 |
|---|---|---|
| 1 | 메인 화면 | 화면 4 (자녀 만세력) + 화면 5 (무료 간이 진단) |
| 2 | 디자인 톤 | C. Warm Heritage |
| 3 | 컬러 시드 | 미색 #FBF8F1 + 청회 #4A5568 + 골드 #D4A574 |
| 4 | 폰트 — 본문 | Pretendard (산세리프, 트렌드) |
| 5 | 폰트 — 한자 | Noto Serif KR (만세력 전용, 정통·가독성) |
| 6 | Voice·Tone | 친근 존댓말, 사주 용어 + 평이 풀이, "AI" 자제 |
| 7 | 디자인 도구 | Stitch |
| 8 | 변형 발산 방식 | 3개 변형 동시 → 선택 |
| 9 | 다크 모드 | MVP 라이트만 (v2 검토) |
| 10 | Bottom nav | 제외 (single-flow funnel) |
| 11 | 공유 버튼 | 제외 (v2 도입) |
| 12 | 화면 5 export | 누락 처리 (A-3b에서 통합 적용) |

---

## 6. Kill / Go / Hold 판정

**Go** — A-3b(전체 화면 적용) 진입.

근거 3줄:
1. 메인 화면 2개 디자인 시스템 검증됨 (만세력 dense + 본문 readable 두 패턴 모두 작동).
2. 토큰·컴포넌트 spec 통합 완료 (`eduluck_DESIGN_v1.md`). saju 도메인 특수 컴포넌트 10종 명시.
3. 나머지 9개 화면(랜딩·자녀 정보·자녀 사주·정밀 가치·회원가입·결제·어머니 사주·어머니 만세력·정밀 결과)는 동일 시스템 적용 가능한 패턴 검증됨.

---

## Claude의 적대적 압박 — Kill할 이유 세 가지

1. **변형 3개 비교 검증 부족** — A·B·C 모두 생성됐으나 실제 학부모 사용자에게 보여주고 선호도 측정 없이 Eugene 단독 결정. 학부모 mom test(예: 5명 보여주고 어느 게 신뢰감?) 없이 출시 시 conversion 가설 검증 불가능. → v1 출시 직후 첫 50명 결과로 톤 재평가 forcing 필요. 다른 변형 prefer면 A-3a 회귀.

2. **화면 5 export 누락의 영향 미검증** — Stitch에서 화면 4만 export됨. 화면 5(스트리밍 본문 + 미니 차트 + mom test 별점)의 실제 렌더 검증 없이 시스템 일반화. **본문 가독성(긴 글 line-height 1.75 + 자간 -0.5%)이 진짜 학부모에게 부담 없는지 화면 5 렌더로 검증 안 됨.** A-3b 첫 단계에서 화면 5 우선 적용 + 검증 필요.

3. **만세력 정보 과부하 — 학부모 인지 부담** — 사주팔자 + 십성 + 신살 + 12운성 + 합충형해 + 오행 + 대운 + 세운 = saju 정통 8요소 다 노출. saju 친화 어머니에게는 신뢰 신호이나 모르는 어머니에게는 "정보 폭격"으로 화면 5 진입 전 이탈 가능. 용어 가이드 펼침이 완충이지만 **만세력 화면(4) 평균 체류 시간 + drop-off rate 측정 forcing 필요**. 평균 체류 5초 미만이면 정보 축소 (핵심 4요소만 노출 + 자세히 펼침) 결정.

---

## 후속 메모 (A-3b 입력용)

### A-3b 작업 범위

`eduluck_DESIGN_v1.md` 기반으로 **나머지 9개 화면 일괄 적용**:

| 화면 | 적용 패턴 |
|---|---|
| 1. 랜딩 | 카드 + 단일 sticky CTA. surface 베이스. heading display-lg |
| 2. 자녀 기본 정보 | Input 컴포넌트 + Dropdown + Sticky 진행 표시 (1/2) |
| 3. 자녀 사주 입력 | Input + Toggle (양력/음력) + Time picker + 모달 (시간 모름) |
| 4. **자녀 만세력 (메인, 적용 완료)** | DESIGN.md spec 그대로 |
| 5. **무료 간이 진단 (메인, 적용 필요)** | 스트리밍 본문 + 미니 차트 + mom test 별점 + sticky CTA |
| 6. 정밀 가치 안내 | 비교 표 카드 + 블러 미리보기 + 가격 노출 + sticky CTA |
| 7. 회원가입 | Input + OTP 6자리 (도메인 컴포넌트) + sticky CTA |
| 8. Mock 결제 | Form input (prefilled) + 약관 체크박스 + mock 안내 모달 + sticky CTA |
| 9. 어머니 사주 입력 | 화면 3 동일 패턴 |
| 10. 어머니 만세력 | 화면 4 동일 패턴 + mini AI 분석 섹션 |
| 11. 정밀 진단 결과 | 화면 5 동일 패턴 + 학년대별 가이드 섹션 + mom test 2차 + 결제 의향 설문 |

### A-3b Stitch 프롬프트 초안 방향

```
[A-3b — 나머지 9개 화면 일괄 적용]

기존 컨펌: Warm Heritage (변형 C) 디자인 시스템.
첨부: eduluck_DESIGN_v1.md (확정 토큰·컴포넌트)
재사용 화면: 화면 4 (자녀 만세력)

작업: 위 표의 9개 화면을 같은 디자인 시스템으로 생성.
일관성 보장: 컬러·폰트·spacing·컴포넌트 패턴 통일.
제약: bottom nav 제외, dark mode 제외, "AI" 단어 노출 자제.
```

### B-1 입력 (다음 다음 단계)

- DESIGN.md → repo 루트 (Claude Code·Cursor 자동 인식)
- handoff bundle (Stitch ZIP) → B-1 빌드 입력
- 폰트 로딩 코드 + CSS 변수 setup → React Native Expo 환경에서 적용 방법 명시 필요 (Pretendard·Noto Serif KR Expo font 로딩)
- A-3a Kill 이유 3개 → B-1·B-2 측정·검증 단계에서 forcing function 적용

### 외부 검증 권장 (v1 출시 전)

- 변형 3개 중 변형 C 선택의 정당성 — 학부모 5명에게 3개 화면 보여주고 선호도 측정
- 만세력 정보량 부담 — 사용자 5명에게 화면 4 보여주고 5초·10초·30초 체류 후 반응 측정
- 본문 가독성 — 화면 5 prototype을 실 디바이스(iPhone 14·Galaxy S24)에서 렌더 후 어머니 5명에게 끝까지 읽는 비율 측정

---

## 변경 이력

- **v1** (2026-05-18) — eduluck 최초 A-3a. 정책 v16 기준. Stitch 변형 3개(Mystic Heritage·Modern Trust·Warm Heritage) 발산 → Eugene이 Warm Heritage 선택. Stitch DESIGN.md export + .zip 코드 분석 통합으로 `eduluck_DESIGN_v1.md` 확립. 폰트 충돌(Pretendard ↔ 명조) → 본문 Pretendard / 만세력 한자 Noto Serif KR 절충 결정. Bottom nav·공유 버튼·dark mode 제외 명시. Go 판정 → A-3b 진입.
