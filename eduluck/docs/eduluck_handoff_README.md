# eduluck — Claude Code Handoff README

> A 트랙(기획) 완료. B-1·B-2(빌드)부터 Claude Code에서 진행.
> 이 파일 한 장만 Claude Code에 가지고 가도 모든 context 파악 가능.

---

## 1. 가져갈 파일 (총 12개)

### 🎨 디자인 시스템 — 필수, repo 루트
- `eduluck_DESIGN_v1.1.md` → **DESIGN.md로 rename** (Claude Code·Cursor 자동 인식 파일명)

### 📋 A 트랙 문서 — 필수, `docs/` 폴더
- `eduluck_A-0_v3.md` (비전·핵심 가설)
- `eduluck_A-1_v4.md` (프로세스·13 Step·시나리오·톤 마커)
- `eduluck_A-2_v2.md` (화면 11개 풀 spec)
- `eduluck_A-3a_v1.md` (디자인 컨셉 결정)
- `eduluck_A-3b_v1.md` (전체 적용 + **P0 checklist 11종**)

### 🖼 Stitch 결과 — 참조용, `docs/stitch_reference/`
- `stitch_eduluck_saju_interface_concepts.zip` (압축 풀어서 11개 화면 `screen.png` + `code.html`)

### 📖 가이드 (선택, 참조용)
- `08_가이드_Claude_Design과_Stitch_v1_1.md`

### 📄 이 파일
- `eduluck_handoff_README.md`

---

## 2. 권장 repo 구조

```
eduluck/
├── CLAUDE.md                    # Claude Code 첫 turn에서 생성
├── DESIGN.md                    # = eduluck_DESIGN_v1.1.md rename
├── docs/
│   ├── A-0_vision.md
│   ├── A-1_process.md
│   ├── A-2_screens.md
│   ├── A-3a_concept.md
│   ├── A-3b_full_apply.md
│   ├── handoff_README.md        # 이 파일
│   └── stitch_reference/
│       ├── screen_01_landing.png
│       ├── screen_02_child_info.png
│       ├── screen_03_child_saju.png
│       ├── screen_04_child_manse.png
│       ├── screen_05_basic_diagnosis.png
│       ├── screen_06_premium_pitch.png
│       ├── screen_07_signup.png
│       ├── screen_08_mock_payment.png
│       ├── screen_09_mother_saju.png
│       ├── screen_10_mother_manse.png
│       ├── screen_11_premium_result.png
│       └── code_html/           # 11개 화면 Tailwind HTML reference
├── app/                         # Expo Router 라우팅
├── components/
├── lib/
├── ...
```

---

## 3. Claude Code 첫 prompt (추천 템플릿)

```
이 프로젝트는 eduluck — saju 기반 학운 진단 서비스.

타겟: 학생(초·중·고) 자녀 둔 30~45세 어머니
기술 스택: React Native (Expo Router) + Vercel (web) + EAS Build
MVP 목표: 무료 간이 진단 → 정밀 진단 3,000원 mock 결제 검증

[입력 자료]
- DESIGN.md (루트) — 확정 디자인 시스템
- docs/A-0~A-3b — 기획 문서 (비전·프로세스·화면·디자인 결정)
- docs/stitch_reference/ — 11개 화면 시각·코드 reference
- docs/handoff_README.md — 한 페이지 요약

[B-1 작업]
1. CLAUDE.md 작성 — 빌드 가이드 (스택·컨벤션·테스트·P0 checklist forcing)
2. docs/B-1_spec.md 작성 — SPEC (라우팅·상태·API·DB·만세력 통합
   ·AI prompt 3종·mock 결제·측정 지표)

[내가 답할 정보 — 시작 전에 물어봐줘]
- Q1: 만세력 엔진 인터페이스 (REST API or 라이브러리?)
- Q2: AI 엔진 (Claude API or OpenAI?)
- Q3: 인프라 (Vercel + Supabase Seoul + Resend 가정 OK?)

[중요 forcing]
- DESIGN.md §10 P0 빌드 checklist 11종 — 모든 빌드 산출물 이 checklist 통과 필수
- A-3b §3 발견 이슈 — Stitch generation의 spec 위반 4종 수정 강제
- A-1 §후속 메모 톤·깊이 참조 — Eugene 샘플 reading 톤 마커 AI prompt 설계에 직접 반영
```

---

## 4. P0 빌드 Checklist (DESIGN.md §10 carry)

CLAUDE.md에 forcing function으로 박힘:

```markdown
[ ] 헤딩 = Noto Serif KR 600-700 (모든 화면)
[ ] 사주팔자 표는 화면 4 패턴 단일 진실 (한자만 + 십성 별도 카드)
[ ] 화면 8 카드 번호: "1234-5678-9012-3456" (완전 표시, 마스킹 X)
[ ] 화면 11 mom test 2차 질문 spec대로:
    Q1: "정밀 진단이 결제할 만한 가치였나요?"
    Q2: "실제로 결제했다면 하시겠나요?"
[ ] 화면 10 "AI 분석 완료" 배지 제거 (또는 "분석 완료")
[ ] 모든 화면 한글 라벨 (영문 라벨 금지)
[ ] 모든 화면 우측 상단 ⚙️ 설정 아이콘 제거
[ ] 화면 9 시간 모름 체크박스 추가
[ ] Inline keyword highlight 컴포넌트 (사주 용어 골드)
[ ] Success header 컴포넌트 (화면 9)
[ ] Price emphasis 배지 (화면 6·8)
```

---

## 5. 핵심 결정 사항 (carry)

| 항목 | 결정 |
|---|---|
| 헤딩 폰트 | Noto Serif KR 600-700 |
| 본문 폰트 | Pretendard 400 |
| 한자 폰트 | Noto Serif KR (.hanja class) |
| 컬러 시스템 | 한지 미색 #FBF8F1 + 청회 #4A5568 + 골드 #D4A574 |
| 학년 구간 | 3구간 (초·중·고) |
| 사주팔자 표 | 화면 4 패턴 단일 진실 |
| 자시 vs 시주 비움 | 만세력 엔진이 자체 처리 (UI는 시간 모름 UX만) |
| 만세력 계산 | 기존 구현 활용 (별도 빌드 X) |
| 결제 | mock (실 게이트웨이 X) — 3,000원 표시 |
| 인증 | 이메일/비밀번호 + OTP 6자리 (소셜은 v2) |
| Dark mode | v2 (MVP는 라이트만) |
| 다국어 | 한국어만 (영문은 v2) |

---

## 6. AI Prompt 설계 핵심 (B-1에서 작성)

AI 호출 3종:
1. **간이 진단** (화면 5) — 자녀 사주만 → A4 0.5p ~15~20문장
2. **mini 관계 분석** (화면 10) — 자녀+어머니 사주 → 2-3문장
3. **정밀 진단** (화면 11) — 자녀+어머니 종합 → A4 1페이지 ~30~40문장

Prompt 구성 (3개 공통):
- 만세력 JSON (천간·지지·십성·신살·12운성·합충형해·대운·세운)
- 학년대별 톤 분기 (초·중·고 3구간)
- 성별·학년 contextual layer
- 어머니 사주 JSON (정밀·관계분석시)
- 분량 spec (간이 ~15~20 / 정밀 ~30~40)

톤 마커 (A-1 §후속 메모 참조):
- 친근 존댓말 ("나와요", "보여요", "맞아요")
- 사주 용어 + 즉시 평이한 풀이
- 사주 분석 → 즉시 실행 액션 (영어 이름·학군지·학원·친구·훈육)
- 부모-자녀 합 분석
- (고등 학년) 전공·학교 예측

---

## 7. MVP 측정 지표 4종 (forcing)

B-1 SPEC.md에 측정 collector 명시:

| # | 지표 | 수집 위치 |
|---|---|---|
| 1 | P1 mom test 1차 점수 | 화면 5 별점 → DB |
| 2 | P1→P2 conversion rate | 화면 5 sticky CTA 탭 → 화면 6 진입 |
| 3 | 화면 8 결제 완료율 | 화면 8 결제 버튼 탭 → mock 완료 |
| 4 | S3.2 mom test 2차 + 결제 의향 점수 | 화면 11 별점 2종 → DB |

---

## 8. v2 이후 확장 (out of scope for B-1·B-2)

- PDF 리포트 / 대시보드 / P4 매년 갱신
- 카카오·네이버 소셜 로그인
- 구독 결제 (단발 → 연간)
- 아버지 사주 옵션
- 자녀(중·고) 직접 사용 화면
- 명리 rule-based 엔진 통합

---

## 9. 외부 검증 (B-2 출시 후 forcing)

- v1 출시 첫 100명 — mom test 1차·2차 점수 평균
- 평균 3점 미만 → A-3 회귀 (톤 재선택 또는 정보량 축소)
- 학부모 5명 대상 정성 인터뷰 (만세력 정보 부담·헤딩 명조 톤 검증)

---

## 10. 회귀 발생 시 흐름

```
B-1/B-2 빌드 중 spec 모호함 발견 → docs/ A 트랙 문서 회귀
   ↓
회귀 시 새 버전 생성 (예: A-2_v3.md)
   ↓
관련 후속 문서도 동기화 (DESIGN.md → v1.2 등)
   ↓
Claude Code의 코드도 따라 수정
```

---

## 끝

A 트랙 산출물은 모두 정합 상태. B-1·B-2는 이 README와 첨부 파일들 가지고 Claude Code에서 진행. 막힐 때 Claude chat으로 돌아와도 됨.
