---
name: 만세력 해석 고도화 v2 — 합충형파해·지장간·과학자톤
slug: manse-v2-hapchunh-sciencetone
type: other
status: 보류
created: 2026-04-24 20:35
completed:
suspended: 2026-05-31
suspended_reason: sajutalk 프로젝트 hold (eduluck mom test 우선). 재개 시 status를 다시 진행중으로.
---

# 만세력 해석 고도화 v2 — 합충형파해·지장간·과학자톤

## 완료 기준

- [ ] 합충형파해 + 지장간 계산 결과가 interpret/qna 프롬프트에 주입되고, 채팅 답변에 "월일 충" 등 구체적 표현이 나타남 (수동 확인)
- [ ] 채팅 AI 톤이 "친근한 역술가"에서 "과학자+심리상담가 스타일(확률 % 표현 포함)"로 전환됨 (수동 확인)
- [ ] 오늘 날짜 자동 주입 + next build 통과 + localhost 서버 정상 가동

## 한눈에 보기

### 개발 계획 관점 — 구현

| 단계 | 구현 파일/컴포넌트 | 검증 주체 |
|---|---|---|
| 1. 지장간 모듈 | `lib/manse/jijanggan.ts` (신규) | AI |
| 2. 합충형파해 모듈 | `lib/manse/hapchunh.ts` (신규) | AI |
| 3. 만세력 엔진 확장 | `lib/manse/engine.ts` | AI |
| 4. 오늘 날짜 주입 | `lib/prompts/interpret.ts`, `qna.ts`, `summary.ts` | AI |
| 5. 프롬프트 톤 전면 개편 | `lib/prompts/interpret.ts` INTERPRET_SYSTEM | AI |
| 6. QNA 시스템 프롬프트 동기화 | `lib/prompts/qna.ts` QNA_SYSTEM | AI |
| 7. 합충 데이터 프롬프트 주입 | `lib/prompts/interpret.ts` buildInterpretPrompt | AI |
| 8. 빌드·서버·알림 | `next build` + dev server + Telegram | AI |

### 개발 계획 관점 — 테스트

| 단계 | 단위 테스트 | 통합 테스트 |
|---|---|---|
| 1. 지장간 | 대표 지지 6개 출력 확인 (node 스크립트) | - |
| 2. 합충형파해 | 甲子日柱+庚午年柱 → 자오충 감지 확인 | - |
| 3. 만세력 엔진 | /api/manse 응답 JSON에 hapchunh 필드 확인 | - |
| 4~6. 프롬프트 | 빌드 통과 (타입 오류 없음) | 채팅에서 톤 변화 수동 확인 |
| 7. 합충 주입 | 프롬프트 문자열에 충·합 섹션 있는지 확인 | - |
| 8. 빌드 | next build 성공 | localhost:3002 접속 확인 |

### 완료 기준 관점

| 완료 기준 | 핵심 구현 | 검증 방법 | 검증 주체 |
|---|---|---|---|
| 합충형파해 프롬프트 주입 | hapchunh.ts + engine.ts + buildInterpretPrompt | 채팅 답변에 "충" 표현 등장 | 사람 |
| 과학자톤 전환 | INTERPRET_SYSTEM + QNA_SYSTEM 전면 개편 | 채팅 답변 톤 직접 읽기 | 사람 |
| 오늘 날짜 주입 + 빌드 통과 | 3개 프롬프트 파일 | next build + 서버 접속 | AI |

## 개발 계획

1. **지장간 모듈** `lib/manse/jijanggan.ts` (신규)
   - 12지지별 지장간(암장된 천간) 고정 테이블
   - `getJijanggan(branch: string): string[]` — 주기간(主氣干) 우선 순서로 반환
   - 4기둥 전체 지장간 계산: `calcAllJijanggan(pillars) → Record<string, string[]>`

2. **합충형파해 모듈** `lib/manse/hapchunh.ts` (신규)
   - 천간합 5종 (갑기·을경·병신·정임·무계)
   - 지지합: 6합 6종 + 3합 4종 (반합 포함)
   - 지지충 6종 (자오·축미·인신·묘유·진술·사해)
   - 삼형 3종 + 자형 4종
   - 지지파 4종 (주요), 지지해 6종
   - 공망: 일주 기준 60갑자 나머지 계산
   - `calcHapchunh(pillars) → HapchunhResult` 반환

3. **만세력 엔진 확장** `lib/manse/engine.ts`
   - `ManseResult`에 `jijanggan`, `hapchunh` 필드 추가
   - `computeManse()` 내부에서 두 함수 호출

4. **오늘 날짜 주입** (interpret.ts, qna.ts, summary.ts)
   - `const today = new Date().toISOString().slice(0, 10)` 서버에서 계산
   - 프롬프트 컨텍스트 맨 위에 `[분석 기준일]: YYYY-MM-DD` 고정 삽입

5. **프롬프트 톤 전면 개편** `lib/prompts/interpret.ts`
   - INTERPRET_SYSTEM: 역술가 톤 → 과학자+심리상담가 톤
   - 확률 언어 필수: "이 구조에서는 약 X할 정도가..." "데이터상..."
   - 결론 먼저 → 근거 나중 구조 유지
   - 불확실성 인정: "물론 개인차가 있어요" 포함
   - buildInterpretPrompt에 hapchunh·jijanggan 섹션 추가 주입

6. **QNA 시스템 프롬프트 동기화** `lib/prompts/qna.ts`
   - QNA_SYSTEM을 새 INTERPRET_SYSTEM 기반으로 동기화

7. **합충 데이터 buildQnaPrompt 주입** `lib/prompts/qna.ts`
   - buildManseSection에 hapchunh 섹션 추가

8. **빌드·서버·텔레그램 알림**

## 단위 테스트 계획

- **jijanggan.ts**: `getJijanggan('자')` → `['계']`, `getJijanggan('인')` → `['갑','병','무']` 확인 — AI 직접 확인
- **hapchunh.ts**: `calcHapchunh({year:'갑자', month:'무오', day:'경오', hour:null})` → 자오충(년일) 감지 확인 — AI 직접 확인
- **빌드**: `next build` 타입 오류 없음 — AI 직접 실행

## 통합 테스트 계획

- **합충 주입 확인**: ⚠️ 직접 실행 불가 — LLM 비용 발생. 수동 검증: localhost:3002에서 채팅하여 답변에 "충" 관련 표현 나오는지 확인
- **톤 전환 확인**: ⚠️ 직접 실행 불가 — LLM 비용 발생. 수동 검증: 사용자가 채팅 답변 읽고 과학자+심리상담가 말투인지 확인

## 사람만 가능

- 채팅 답변 품질 직접 읽기 (톤 변화 + 합충 표현 등장 여부 판단)

## 중단/롤백 조건

- next build 타입 오류 발생 시: 오류 수정 후 재빌드
- 합충 계산 오류(검증값과 불일치) 발생 시: hapchunh.ts 테이블 수정 후 재확인
- 롤백: `git checkout HEAD~ lib/prompts/interpret.ts lib/prompts/qna.ts lib/manse/engine.ts`

## 맥락

- 이전 run(saju-interpretation-enhancement)에서 신살 19종·용신·대운·세운·월운 주입까지 완료
- backlog 항목 2개 승격: 합충형파해+지장간, 오늘날짜 주입
- ChatGPT/Gemini/Claude 3개 AI 합의: 합충형파해(20% 가중치)가 현재 미구현 가장 큰 gap
- 톤 변경: "역술가"로는 차별화 없음. 28-34 타겟은 과학적·확률적 표현에 신뢰감

---

## Report

> /worklog 실행 시 완료 기준이 모두 충족되면 자동으로 작성 제안됨.

_(진행중)_
