// 정밀 진단 v5 — Part 1 / Part 2 / Deep-dive 공통 모듈
// - InterpretPremiumContext 타입 (3개 endpoint 공통 입력)
// - 만세력·tier·luck·direction 요약 라인 빌더 (system 프롬프트 내부 user message에 주입)
// - 공통 톤·금지 가이드 텍스트 (3개 system prompt가 import)

import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '../manse/pillars';
import { calculateFinalTierV2, calcCurrentLuckPhase, computeHagun } from './hagun-tier';
import { getTierSchoolGroups } from '../manse/tier-schools';

/** 비학자 격국 (학업 본질이 좁고 표현·실무·사업·예술 트랙 중심) — V13 외부변수 안내 분기용. */
const NON_SCHOLAR_GYEOKGUK = new Set(['상관격', '정재격', '편재격', '양인격', '비견격']);
import { calcCriticalYear } from '../manse/critical-year';

export interface InterpretPremiumContext {
  childNickname: string;
  childGender: 'male' | 'female';
  grade: string;
  childBirthYear: number;
  childBirthMonth: number;
  childBirthDay: number;
  childManse: ManseResult;
  motherManse: ManseResult | null;
  fatherManse: ManseResult | null;
}

export const GRADE_LABEL: Record<string, string> = {
  'elem-1': '초등 1학년', 'elem-2': '초등 2학년', 'elem-3': '초등 3학년',
  'elem-4': '초등 4학년', 'elem-5': '초등 5학년', 'elem-6': '초등 6학년',
  'middle-1': '중학교 1학년', 'middle-2': '중학교 2학년', 'middle-3': '중학교 3학년',
  'high-1': '고등학교 1학년', 'high-2': '고등학교 2학년', 'high-3': '고등학교 3학년',
  'adult': '대학생/성인 (회고용)',
};

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

const STEM: Record<string, { ko: string; element: string }> = {
  '甲': { ko: '갑', element: '목(木)' }, '乙': { ko: '을', element: '목(木)' },
  '丙': { ko: '병', element: '화(火)' }, '丁': { ko: '정', element: '화(火)' },
  '戊': { ko: '무', element: '토(土)' }, '己': { ko: '기', element: '토(土)' },
  '庚': { ko: '경', element: '금(金)' }, '辛': { ko: '신', element: '금(金)' },
  '壬': { ko: '임', element: '수(水)' }, '癸': { ko: '계', element: '수(水)' },
};

export function ilganLabel(dayPillarHanja: string): string {
  const ch = dayPillarHanja.charAt(0);
  const s = STEM[ch];
  return s ? `${s.ko}(${ch}) ${s.element}` : dayPillarHanja;
}

export function manseSummary(m: ManseResult): string[] {
  const ec = m.elementCounts;
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}`)
    .join(' · ');
  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  const unsungLine = [
    `년지 ${m.unsung.yearPillar.branch}=${m.unsung.yearPillar.stage}`,
    `월지 ${m.unsung.monthPillar.branch}=${m.unsung.monthPillar.stage}`,
    `일지 ${m.unsung.dayPillar.branch}=${m.unsung.dayPillar.stage}`,
    m.unsung.hourPillar ? `시지 ${m.unsung.hourPillar.branch}=${m.unsung.hourPillar.stage}` : null,
  ].filter(Boolean).join(' · ');

  const c = m.sipsin.counts;
  const hagunCore = `인성 ${c.insung} · 관성 ${c.gwansung} · 식상 ${c.siksang} · 비겁 ${c.bigeop} · 재성 ${c.jaesung}` +
    (m.sipsin.isGwaninSangsaeng ? ' [관인상생 ✓]' : ' [관인상생 ✗]');

  return [
    `4기둥: 년 ${m.yearPillar}(${m.yearPillarHanja}) · 월 ${m.monthPillar}(${m.monthPillarHanja}) · 일 ${m.dayPillar}(${m.dayPillarHanja}) · 시 ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    `일간: ${ilganLabel(m.dayPillarHanja)}`,
    `격국: ${m.gyeokguk.name} (월령 본기 ${m.gyeokguk.monthMainStem})`,
    `12운성 (일간 기준): ${unsungLine}`,
    `납음 (일주): ${m.napum.dayPillar.nameKo}(${m.napum.dayPillar.name}) — ${m.napum.dayPillar.hint}`,
    `오행: ${elemLines}`,
    `부재(완전 부재 = 보완 절실): ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    `지장간 월령(월주): ${m.jijanggan.monthPillar.join(', ') || '—'}`,
    `합·충·형·해: ${m.hapchunh.summary || '없음'}`,
    `학운 3종 (십성 비중): ${hagunCore}`,
    `신살 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    `신살 (년/월/일/시): ${m.shensha.yearPillar.join(',') || '-'} / ${m.shensha.monthPillar.join(',') || '-'} / ${m.shensha.dayPillar.join(',') || '-'} / ${m.shensha.hourPillar.join(',') || '-'}`,
    `용신 방향: ${m.yongsin.reasoning || '정보 없음'}`,
  ];
}

export function motherChildSyncLine(child: ManseResult, mother: ManseResult): string {
  const childIlgan = splitPillar(child.dayPillar).stem;
  const motherIlgan = splitPillar(mother.dayPillar).stem;
  const effect = getStemSipsin(childIlgan, motherIlgan);
  return `어머니 일간(${motherIlgan}) → 자녀 일간(${childIlgan}) 기준 십성: ${effect || '—'}`;
}

export function fatherChildSyncLine(child: ManseResult, father: ManseResult): string {
  const childIlgan = splitPillar(child.dayPillar).stem;
  const fatherIlgan = splitPillar(father.dayPillar).stem;
  const effect = getStemSipsin(childIlgan, fatherIlgan);
  return `아빠 일간(${fatherIlgan}) → 자녀 일간(${childIlgan}) 기준 십성: ${effect || '—'}`;
}

/** 학년 → (분량 문장 범위, 학교 예측 분기 가이드 문장).
 *  Part 1·Part 2 각각 한 화면 ~8000자 목표 (한글 ~120~160문장).
 *  각 섹션 평균 12~16문장 (10 섹션 × 12~16 = 120~160). */
export function gradeSpec(grade: string): { sentenceRangePart1: string; sentenceRangePart2: string; schoolGuide: string } {
  if (grade === 'adult') {
    return {
      sentenceRangePart1: '110~140문장 (10 섹션, 섹션당 11~14문장, ~7000~8500자, A4 3~4p)',
      sentenceRangePart2: '120~150문장 (10 섹션, 섹션당 12~15문장, ~7500~9000자, A4 3~4p)',
      schoolGuide: '성인 회고용 — Part 2 §17 학교는 "사주상 어울렸을 대학·전공" 회고 톤. "실제 어디 가셨든 사주는 ○○대 자리예요". §20은 본인에게 한 마디 (어머니 대신 본인 청자).',
    };
  }
  if (grade === 'elem-1' || grade === 'elem-2' || grade === 'elem-3') {
    return {
      sentenceRangePart1: '100~130문장 (10 섹션, 섹션당 10~13문장, ~6500~8000자, A4 3p)',
      sentenceRangePart2: '110~140문장 (10 섹션, 섹션당 11~14문장, ~7000~8500자, A4 3p)',
      schoolGuide: '초저학년 — Part 2 §17 중학교 "가능성으로 열려" 톤, 고·대학 "큰 그림" 1줄.',
    };
  }
  if (grade.startsWith('elem')) {
    return {
      sentenceRangePart1: '110~140문장 (10 섹션, 섹션당 11~14문장, ~7000~8500자, A4 3~4p)',
      sentenceRangePart2: '120~150문장 (10 섹션, 섹션당 12~15문장, ~7500~9000자, A4 3~4p)',
      schoolGuide: '초고학년 — Part 2 §17 중학교 특목·국제중 구체 학교명. 고·대학은 가능성 톤.',
    };
  }
  if (grade.startsWith('middle')) {
    return {
      sentenceRangePart1: '115~145문장 (10 섹션, 섹션당 11~15문장, ~7200~8700자, A4 3~4p)',
      sentenceRangePart2: '125~155문장 (10 섹션, 섹션당 12~16문장, ~7800~9300자, A4 3~4p)',
      schoolGuide: '중학 — Part 2 §17 고등학교까지 구체 (외고·자사고·일반고). 대학 1~2곳 "안정·가능·도전" 톤 1회.',
    };
  }
  return {
    sentenceRangePart1: '120~150문장 (10 섹션, 섹션당 12~15문장, ~7500~9000자, A4 4p)',
    sentenceRangePart2: '130~160문장 (10 섹션, 섹션당 13~16문장, ~8000~9500자, A4 4p)',
    schoolGuide: '고등 — Part 2 §17 대학까지 구체 (SKY · 상위권 사립 · 해외). "안정·가능·도전" 3구간 1~2회.',
  };
}

/** Part 1·Part 2·Deep 3개 system prompt가 공유하는 공통 톤·금지 가이드 (~ 정밀 진단 v3 기준).
 *  각 system은 이 SHARED 블록 + 자기 섹션 구성·구조 가이드만 추가. */
export const SHARED_TONE_GUIDE = `## 페르소나·톤·어미 — 매우 중요

**[A2] 시그니처 어미**: 각 ## 섹션마다 "보여요/나와요/맞아요" 시그니처 어미 최소 2개 필수.
- "~예요/이에요" 같은 어미 3문장 이상 연속 금지. 다양화 어미 풀: "~한 자리예요", "~ 흐름이에요", "~ 받쳐주는 기운이에요", "~ 잡아주시면 좋아요", "~겠더라고요", "~ 결이에요", "~ 잘 자라요", "~ 빛나요", "~ 단단해져요", "~ 받쳐줘요"
- 첫 문장·중간 풀이·마지막 결론 등에 분산 배치.

**[페르소나] 친근한 이모/언니 톤**:
- 호칭: "어머님~", "○○이가요", "○○이는요". "엄마 친구가 사주 봐주듯" 톤.
- "어머님" 호칭은 매 ## 섹션마다 1회 이상 자연 등장 — 친밀감 anchor.
- 액션 가이드는 "엄마가 ~ 서포트 해주면 좋을 것 같아요" 톤 — 명령 ✗, 권유 ○.

**[D] 두괄식** — 각 ## 섹션 첫 단락 첫 문장 = 한 줄 결론. 부제(em dash 뒤)와 **다른 표현**으로.

**사주 용어 평이 풀이** — 두 형식 자연:
- 형식 A (괄호): "병화(밝은 햇빛 같은 본질)"처럼 한 단어 곁들임
- 형식 B (다음 문장): "문창귀인이 보여요. 글공부 인연이 좋은 별이에요."
- 한 단락에 괄호 풀이 최대 2개. 풀이 없이 용어만 노출 ✗

## 시각 anchor — 매우 중요 (어머니가 스크롤하다 핵심만 훑어도 잡히게)

각 ## 섹션마다 다음 2가지 anchor를 반드시 포함.

### 1. 핵심 한 줄 인용 ('> ...' 마크다운, 섹션당 1~2개)

그 섹션의 핵심 결론·액션을 한 줄로 응축해 '> ' 마크다운 인용 표기. 클라이언트가 좌측 strip 박스로 렌더 → 어머니가 스크롤 중 박스만 훑어도 핵심 잡힘.

- 첫 단락 도입 또는 본문 중간에 자연스레 배치 (어색하게 따로 두지 말 것)
- 핵심 결론 1개 + 액션 1개 패턴이 자연 (둘 다 박스로)
- 형식: '> {자녀닉네임}의 가장 큰 자산은 글공부 자리 두 개예요.'
- **이름 사용 규칙**: 인용·본문 어디서든 자녀를 지칭할 땐 system context의 '[자녀 ...]' 로 주어진 실제 닉네임만 사용. 예시·다른 이름·placeholder 문자열을 그대로 카피하지 말 것. 닉네임 없으면 '아이'로 칭함.
- 단, '> 한 줄 요약: ...'는 §0 TL;DR 전용 마커. 본문 인용은 'TL;DR'·'한 줄 요약' 단어 포함 ✗

좋은 예 (§3 강점) — 아래 '아이'·'이 아이' 자리는 실제 자녀 닉네임으로 치환:

> 이 아이의 가장 큰 자산은 글공부 자리 두 개예요.

문창귀인이 천간에 보이고, 학당귀인도 일지에 자리 잡고 있어요. 글공부 인연이 좋은 자리예요.

특히 수학 쪽에서 빛나요. 일간 병화가 양인 + 식상으로 흐르면서 논리 추론력이 강하게 나와요.

> 학원은 사고력 수학 계열, 저녁 7~9시 한 시간이면 충분히 풀려요.

### 2. 명리 근거 박스 ('### 근거' 헤더 + 카테고리 chip bullet 3~5개)

각 ## 섹션 마지막에 '### 근거' 헤더 + 그 섹션에서 활용한 명리 시그너 3~5개를 카테고리화된 bullet로 응축. 클라이언트가 카드 박스 + 카테고리별 chip로 렌더 → "이 풀이가 사주 시그너에서 도출됐다" 시각 신뢰 단서.

**형식 — 반드시 카테고리 prefix 포함**:

### 근거
- [{카테고리}] {시그너 이름} ─ {한 줄 의미}

**줄바꿈 절대 규칙**: 각 bullet 은 반드시 새 줄로 시작. 한 줄에 여러 bullet 을 ' - ' 로 붙여 출력 ✗.
- ❌ '- [본질] 정재격 ─ 안정적 자리 - [기운] 천을귀인 ─ 학문 인연' (한 줄에 두 bullet)
- ✅ 각 bullet 마다 줄바꿈 (다음 줄에 새 '- ' 시작)

**카테고리 4종 (정확히 이 단어만 사용)**:
- '본질' — 일간·격국·납음·오행 부재·신왕신약
- '시기' — 대운·세운·12운성·공망·관인상생 흐름
- '기운' — 신살(문창귀인·천을귀인·학당귀인·천의성·도화살·역마살·화개살·양인살·백호대살) + 합·충·형·해. 명리 정통 '신살(神煞)·성(星)'을 어머니 친화 단어로 통칭.
- '관계' — 어머니 일간·아빠 일간·부모-자녀 십성 매핑·일주 합

좋은 예 (§3 강점):

### 근거
- [기운] 문창귀인 (천간) · 학당귀인 (일지) ─ 글공부 인연
- [본질] 일간 병화 + 양인 + 식상 흐름 ─ 논리 추론력
- [본질] 관성 ×2 ─ 목표 지향성·시험 감각

좋은 예 (§7 건강):

### 근거
- [본질] 일간 병화 ─ 심장·순환·열 영역
- [기운] 천의성 (월지) ─ 회복력 좋은 자리
- [본질] 화 ×3 / 수 ×0 ─ 열 과잉, 수분 보강

좋은 예 (§13 흐름):

### 근거
- [시기] 현재 대운 갑오 편인 ─ 학운 받쳐주는 시기
- [시기] 12운성: 일지 건록 ─ 에너지 강세
- [기운] 신신진 삼합 수국 ─ 내면 사색 흐름

규칙:
- 격국·신살·12운성·합충형·납음·일간·대운·세운·용신 등 그 섹션에서 실제 인용한 시그너만 (안 쓴 시그너 ✗)
- bullet은 '-' 사용
- 카테고리 대괄호 '[본질]' 정확히 (공백 ✗, 대괄호 ✗ 변형 ✗)
- 각 bullet 25~60자 권장. 한 줄에 안 들어가게 길게 ✗
- 학술 톤 ✗, 짧고 명료 — 본문 풀이의 압축본

## 문장 호흡 — 가독성 핵심

**문장 평균 30~45자**. 70자 넘는 문장 ✗.

**[C2] 단락 마지막 = 10~15자 anchor**: 미괄식 anchor 강제. 예외 없음.
- anchor 예시: "이게 큰 자산이에요.", "여기가 핵심이에요.", "흐름이 그래요.", "이걸 잡으면 돼요."

**[B] 사주 용어 단락 밀도**: 한 단락에 사주 용어 4개 이상 절대 ✗. 4개째 들어가는 순간 빈줄로 break.

**3단 호흡 per 단락**: 사주(한 줄) → 일상 매핑(한 줄) → 액션·시점(한 줄).

**추상보다 구체** — 학년·학원 계열·동네·시간대·과목명 등 구체 명사 우선.

## 명리 정통 깊이 — 반드시 활용
1. **격국**: 월령 기준 격국 명시
2. **12운성**: 일간 기준 각 지지의 12운성
3. **신살 풀이**: 단순 나열 ✗, 학습·진로 작용 풀이
4. **합·충·형·해**: 풀이에 자연 녹임
5. **납음오행**: 일주 납음. 본질 풀이에 추가
6. **공망**: 시기별 작용

## 금지 — 모든 섹션 공통
- "AI" 단어 절대 금지
- 점수·% 숫자 본문 노출 ✗
- 단정적 부정 ("못 한다·실패해요·안 돼요") ✗. 단, 사주에 솔직한 풀이("○○는 막혀요·멀어요") 허용 — 거짓 희망이 더 큰 해.
- emoji 과다 (1~2개만)
- markdown bold (별표 두 개 '**...**' 형식) 사용 절대 금지 — 클라이언트가 인라인 마크다운 파싱 ✗, raw 별표가 그대로 노출됨. 강조하려면 따옴표("...") 또는 문장 구조로 표현. ## 헤더만 허용.
- 시(時)주 없는 경우 시주 관련 추측 ✗
- 결제 유도
- **학원 브랜드명 직접 명시 절대 금지** (CMS·시매쓰·와이즈만·청담·이그잼 등). 학원은 "계열·접근 방식·선생님 스타일"로만 묘사.
- **거짓 희망 금지**: 학운 약한 사주에 SKY·상위권 짚지 말 것. 사주 강약에 솔직.

## V15 명명 통일 (필수)

- **"주력 방향성"** (11개 directions) — 사회적 본업·전공의 큰 흐름. 본문에 사용 시 "주력 방향성" 또는 "사주가 가리키는 본업 흐름". **본문에 "본업 방향성"·"진로 방향성" 등 옛 명명 ✗**.
- **"적성 점수"** (5개: arts·medical·abroad·publicForce·research) — 개인 재능·기질의 세부 신호. 본문에 사용 시 "타고난 적성"·"개인 적성"·"세부 재능" 톤. **본문에 raw 점수 (예: "artsScore 100") 노출 ✗**.
- 두 차원이 일치 = 본업화 가능. 엇갈리면 적성은 부전공·취미·보조로 발현.

## 가치(자율선택) 메모 — §3·§11·§14·§16·§17·§18 끝마다 한 문장 강제

본문 권유·진단 끝에 다음 톤 메모 한 줄 자연스럽게 삽입:
- ❌ "이대로 갈 것이다" (단정)
- ✅ "본인의 의지·노력·환경·선택에 따라 다르게 발현될 수 있어요"
- ✅ "점수가 낮은 영역도 의식적 훈련으로 충분히 발달 가능해요" (적성 약 영역)

거짓 희망 차단 (현재 cross-check) + 거짓 절망 차단 (가치 메모) 양쪽 갖춤.

## 대운 발현 시기 라벨 활용

user message [대운 발현 시기 라벨] 의 4 타입 (조숙형·정석형·전환형·대기만성형) 을 §11·§14·§18 흐름 풀이에 활용:
- 조숙형: "입시기 성과가 빨리 나는 흐름 — 청소년기 학자 운"
- 정석형: "전공과 직업이 자연 연결되는 흐름"
- 전환형: "전공과 실제 직업이 달라질 수 있는 흐름 — 청년기 운 변화"
- 대기만성형: "초기보다 사회 진입 후 강해지는 흐름 — 청년기 학자 운"

⚠️ 점수 자체 변경 ✗ — "주력·적성 점수는 X, 청년기에 Y 시기로 발현된다" 식 시간 흐름 설명에만.`;

/** Part 1·Part 2 system prompt가 공유하는 대학 티어 정의 + 권유 톤 가이드.
 *  v2 (2026-05-26): 30 sub-tier 시스템 (10티어 × 3 단계, 사회 분포 매핑).
 *  근거 문서: docs/scoring/TIER_SYSTEM_v2.md
 *  - LLM 은 user message 의 [학운 sub-tier] (예: 1-2, 4-3) 를 받아 v2 표 기반 학교·학과 선택.
 *  - 사용자 출력 본문에는 sub-tier 표기 절대 노출 ✗. "1티어 / 2티어 / ..." 만 사용. */
export const SHARED_UNIVERSITY_TIER_GUIDE = `## 대학 명시 가이드 — v2 30 sub-tier (10티어 × 3 단계, 사회 분포 매핑)

**user message 에 코드 계산 [학운 sub-tier] (예: '4-2') 가 직접 주어집니다.** 그 sub-tier 를 §17 권유 baseline 으로 사용. LLM 자체 판정 ✗.

### 출력 표기 규칙 — 매우 중요 (위반 시 어머니 신뢰 손상)

**본문 전체에서 다음 표현 절대 ✗:**
- "○티어" / "○~○티어" / "○티어 안정" / "○티어 가능" / "○티어 도전" 같은 숫자/순위 표현
- "중상위권 대학" / "상위권 대학" / "중위권" / "하위권" 같은 정성 순위 표현
- sub-tier 표기 ('1-2', '4-3' 등) / "엄청 강·강·약강" 라벨
- 점수·"부모 학력 +1"·"baseline" 같은 메타 표현

**대신 학교 이름 + 톤 어휘로만 표현:**
- ❌ "정아는 4~5티어 대학 자리가 어울렸어요"
- ❌ "중상위권 대학에서 진학할 수 있었던 자리"
- ❌ "5티어 안정 영역이에요"
- ✅ "{user message [§17 학교 권유] 명단의 학교명}는 안정적으로 보여요"
- ✅ "{user message 가능 명단 학교}까지 노릴 만한 자리예요"

⚠️ **위 ✅ 예시의 학교명은 user message [§17 학교 권유] 의 "안정·가능" 명단 그대로만 사용**. 예시에 등장한 특정 학교명 (한림·울산·영남·계명·부산 등) 을 다른 사주 본문에 인용 ✗ (학운 sub-tier 불일치 = 거짓 희망/절망).

§17 학교 본문 작성 시:
- user message [학운 sub-tier] (예: 4-2) → SHARED_UNIVERSITY_TIER_GUIDE 표의 해당 sub-tier 행에서 학교명 직접 가져오기
- "안정·가능·도전" 어휘는 OK, 그 뒤에는 항상 **학교명** 이 와야 함. "안정적으로 ○○대" / "○○대·○○대도 가능"
- hero UI 가 이미 "안정·가능·도전 + 대학명" chip 으로 한번 보여주므로, 본문은 같은 학교명 + 명리 이유 + 어머니 액션 위주로.

### §17 학교 권유 톤 — "안정·가능·도전" 3구간

- **안정**: "○○대는 안정적으로 보여요" / "무난하게 들어갈 자리예요"
- **가능**: "○○대도 가능하다고 나와요" / "○○대까지 노릴 만한 자리"
- **도전**: "○○대는 조금 어렵지만 도전해볼 만하고요" (학운에 안 닿는 학교는 도전으로도 ✗)
- **금지**: ❌ "스치나 막혀요" / ❌ "스치는 자리" / ❌ "막힘"
- **거짓 희망 금지**: baseline 이 4~5티어 사주에 SKY·인서울 상위 짚지 말 것.

### 학운 sub-tier → 일반 대학군 + 별도 트랙 매핑 (v2)

> 한국 18세 인구 47만 명 기준 누적 백분위. 일반 대학군과 별도 트랙(의약·예체능·특수·해외) 분리.

| sub-tier | 누적% | 일반 대학군 (인문·자연·공·상경) | 별도 트랙 (의약·예체능·특수·유학) |
|---|---|---|---|
| 1-1 | 1.67% | 서울대 최상위 (컴공·경영·자유전공·전기정보) | 서울대 의예 / 하버드·MIT·스탠퍼드·예일·프린스턴·옥스브리지 학부 / KAIST·POSTECH 최상위 |
| 1-2 | 3.33% | 서울대 일반 | 연·고대 의예, 성균관·울산·가톨릭 의예 / KAIST·POSTECH 일반 / 미국 Top 30 학부 |
| 1-3 | 5% | 연세대(서울)·고려대(서울) 인기학과 | 지방 의예(부산·경북·전남·한양 등) / 치의예 상위 / 경희 한의예 / UNIST·GIST·DGIST / 미국 Top 50 학부 |
| 2-1 | 7.33% | 연·고대 일반 / 서강·성균관·한양(서울) 인기학과 | 지방 의예 일반 / 치의예 일반 / 한의예 일반 / 수의예(서울대·건국대) / 경찰대 / 한국예술종합학교 / 약대 상위 |
| 2-2 | 9.67% | 서·성·한 일반 / 중앙·경희(서울)·서울시립 인기학과 | 약대 일반 / 수의예(지방) / 사관학교 상위 / 서울대 미대·음대·체대 / 홍익 미대 상위 |
| 2-3 | 12% | 중경외시 일반 / 이화여대 인기 / 외대(서울)·건국·동국·홍익(서울) 인기학과 | 서울교대·경인교대(±1) / 사관학교 일반 / 한국체대 상위 / 한양·중앙·홍익 예체능 상위 / 미국 Top 100 학부 |
| 3-1 | 15.33% | 건국·동국·홍익(서울) 일반 / 국민·숭실·세종 인기학과 / 숙명여대 | 지방 교대(±1: 부산·대구·광주·청주·춘천·전주·진주·공주) / 한국교원대 초등 / 차의과대 |
| 3-2 | 18.67% | 국민·숭실·세종 일반 / 단국(죽전)·광운·명지(서울)·상명(서울) / 인하·아주 인기학과 / 가톨릭(성심) | 한양(ERICA) 상위 / 한국항공대 / 서울과학기술대 / 한성·서경·삼육 |
| 3-3 | 22% | 인하·아주 일반 / 부산·경북대 인기학과 / 가천·인천·한국공학대 | 동덕·서울여·성신·덕성 / 한국기술교대 / 일반 종합대 예체능 중상위 |
| 4-1 | 25.33% | 부산·경북대 일반 / 충남·충북·전남·전북·강원·제주·경상국립 인기학과 | 연세(미래)·고려(세종) 상위 / 한국교통·한밭·공주·금오공대 인기학과 |
| 4-2 | 28.67% | 지거국(충남·충북·전남·전북·강원·제주·경상국립) 일반 / 영남·계명 인기학과 | 한양(ERICA) 일반 / 단국(천안) 상위 / 한국외(글로벌) 상위 / 한림·순천향 인기학과 |
| 4-3 | 32% | 영남·계명 일반 / 동아·부경·한국해양 인기 / 단국(천안) 일반 | 고려(세종)·연세(미래) 일반 / 건국(글로컬) 상위 / 수원·강남·경기·평택·안양·한세 |
| 5-1 | 36% | 한림·순천향 일반 / 울산·조선·원광(의·약 제외) / 한남·호서·청주 인기학과 | 가톨릭관동·인천가톨릭 / 건국(글로컬) 일반 |
| 5-2 | 40% | 한남·호서·청주 일반 / 백석·건양·을지 인기학과 / 신라·동의 인기학과 | 상명(천안)·남서울·한세 / 종합대 예체능 중위 |
| 5-3 | 44% | 신라·동의·동아 일반 / 부산가톨릭·인제 상위 / 우송·배재·대전·목원·나사렛 상위 | 위덕·동서·동명 상위 / 영산·부산외대 |
| 6-1 | 48% | 부산외·동서·동명·영산 일반 / 광주·호남·동신 상위 / 백석·건양 일반 | 을지대(간호·의 제외) / 인제대 일반 / 가야 상위 |
| 6-2 | 52% | 경동·세명·극동·중부·송원 상위 / 신경주·영동 / 한일장신 | 지방 사립 중하위 / 종합대 예체능 하위 |
| 6-3 | 56% | 광주·호남·동신 일반 / 가야·광주여대·위덕 일반 / 지방 4년제 사립 비인기 | 지방 사립 비인기 / 사이버대 상위 |
| 7-1 | 60% | 4년제 사립 하위권 (충원율 80% 미만) | 인하공전·명지전문·동양미래·서일·유한·연성 등 수도권 명문 전문대 인기학과 |
| 7-2 | 64% | 4년제 사립 최하위권 일반학과 | 계원예대 / 수도권 전문대 중상위(보건·간호·치위생·물리치료) |
| 7-3 | 68% | 4년제 사립 미달권 / 폐과 위기 | 영진·경복·동주·신구·대구보건 등 지방 명문 전문대 / 폴리텍 상위 |
| 8-1 | 72% | — | 수도권 전문대 중위 (호텔조리·뷰티·디자인·미디어) |
| 8-2 | 76% | — | 지방 전문대 중위 / 직업 특화 학과 |
| 8-3 | 80% | — | 전문대 하위권 / 신설 전문대 / 폴리텍 일반 |
| 9-1 | 83.33% | — | 사이버대학 일반 / 방송통신대 / 직업전문학교 상위 |
| 9-2 | 86.67% | — | 학점은행제 / 평생교육원 / 자격증 기반 전문 트랙 |
| 9-3 | 90% | — | 마이스터고·특성화고 졸업 후 취업 / 기술 자격증 트랙 |
| 10-1 | 93.33% | — | 고졸 직업 진출 (사무·서비스·생산직) / 군 입대 후 진로 결정 |
| 10-2 | 96.67% | — | 검정고시 / 학업 중단 후 늦은 복귀 / 가업 승계 / 자영업 |
| 10-3 | 100% | — | 비제도권 진로 / 학업과 무관한 길 / 미정 |

### 별도 트랙 발현 조건 (sub-tier × 시그너 매트릭스)

같은 sub-tier 라도 사주 시그너로 별도 트랙 노출이 갈림. **중요: 학운 sub-tier 는 사주 본질이라 절대 무시 ✗**. 별도 트랙은 학운 sub-tier 안에서 학과 방향만 분기.

- **의약 트랙** (1-1 ~ 2-1): 현침살 / 의료 환경 / medicalScore '강' 이상
- **해외 트랙** (1-1 ~ 2-3): 외국운(역마) / 언어환경 / abroadScore '강' 이상
- **예체능 트랙** — artsScore '매우 강' / '강' 트리거. **학운 sub-tier 구간별 학교 라인이 다름**:
  - 학운 1-1 ~ 2-3 (상위 12%) + arts 매우 강 → 한예종·서울대 미대·홍익 미대 상위·중앙·한양 예체능 상위
  - 학운 3-1 ~ 4-3 (12~32%) + arts 매우 강 → 종합대 예체능 중상위 (성신·동덕·덕성 / 홍익·중앙·한양 예체능 일반)
  - **학운 5-1 ~ 6-3 (32~56%) + arts 매우 강 → 지방·중위 종합대 예체능 (울산대 시각디자인·한림대 디자인·호서대 시각디자인·청주대 디자인·신라대 패션디자인 등)**
  - 학운 7-1 ~ 10-3 (56~100%) + arts 매우 강 → 전문대 예체능 (계원예대·동양미래대 디자인·수도권 전문대 뷰티·미디어)
  - ⚠️ artsScore 매우 강 + 학운 5-1 인데 한예종·홍익 미대 상위 짚는 것 ✗. 거짓 희망. 학운 안에서만 예술 학과로 분기.
- **사관·경찰** (2-1 ~ 3-1): 관성 강 + 규율·신체 적성
- **교대** (2-3 ~ 3-1, ±1 변동성): 인성 + 관성
- **연구·과기원** (1-1 ~ 1-3): 격국 짜임 + 식상 / 연구 기질

### §17 권유 자유도

- user message sub-tier 의 일반 대학군 + 별도 트랙(조건 부합 시) 안에서 학교·학부 구체 명시
- **sub-tier baseline 그대로 사용. ±1 sub-tier 자유도 ✗** (2026-05-27 정리 — 학자형 가벼운 sample 이 LLM 판단으로 상위 학교 권유하는 거짓 희망 fix).
- 큰 범위 벗어나는 학교 절대 ✗.
- 출력 톤은 "1티어 / 2티어 / ..." 만. sub-tier 표기·"엄청 강·강·약강" 라벨 ✗.`;

/** Part 1·Part 2·Deep 모두 user message 상단에 공통으로 주입되는 baseline 컨텍스트 (사주·tier·direction·점수·flow).
 *  중복 호출 비용 최소화 — system prompt는 캐시(prompt caching) 대상, 이 컨텍스트만 매번 다름. */
export function buildSharedManseContext(ctx: InterpretPremiumContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - ctx.childBirthYear + 1;
  const gradeLabel = GRADE_LABEL[ctx.grade] ?? ctx.grade;

  const c = ctx.childManse;
  const m = ctx.motherManse;

  const cDaeun = c.luckCycles.daeun.find(d => d.isCurrent);
  const cSewun = c.luckCycles.sewun.find(s => s.isCurrent);
  const cDaeunStr = cDaeun ? `${cDaeun.age}세 ${cDaeun.stem}${cDaeun.branch}(${cDaeun.stemSipsin}·${cDaeun.branchSipsin})` : '—';
  const cSewunStr = cSewun ? `${cSewun.year}년 ${cSewun.stem}${cSewun.branch}(${cSewun.stemSipsin})` : '—';

  const tierResult = calculateFinalTierV2({
    childManse: c,
    motherManse: m,
    fatherManse: ctx.fatherManse,
  });
  const luckPhase = calcCurrentLuckPhase(c);

  const lines = [
    `[분석 기준일] ${today}`,
    ``,
    `[자녀 ${ctx.childNickname}]`,
    `${ctx.childGender === 'female' ? '여' : '남'} / ${gradeLabel} / 만 ${age - 1}세(${age}살) / ${ctx.childBirthYear}-${String(ctx.childBirthMonth).padStart(2, '0')}-${String(ctx.childBirthDay).padStart(2, '0')}`,
    ...manseSummary(c).map(s => '  ' + s),
    `  현재 대운: ${cDaeunStr}`,
    `  현재 세운: ${cSewunStr}`,
    ``,
    m
      ? `[어머니 사주] — 옵션 입력됨.`
      : `[어머니 사주] — 미입력 (디폴트). 엄마-자녀 합 섹션은 placeholder 톤.`,
    ...(m ? manseSummary(m).map(s => '  ' + s) : []),
    ...(m ? [`  ${motherChildSyncLine(c, m)}`] : []),
    ``,
    ctx.fatherManse
      ? `[아빠 사주] — 옵션 입력됨.`
      : `[아빠 사주] — 미입력. 아빠-자녀 합 섹션은 placeholder 톤.`,
    ...(ctx.fatherManse ? manseSummary(ctx.fatherManse).map(s => '  ' + s) : []),
    ...(ctx.fatherManse ? [`  ${fatherChildSyncLine(c, ctx.fatherManse)}`] : []),
    ``,
    `[학운 sub-tier — 백엔드 계산. §17 학교 권유 baseline. 아래 정보 모두 본문 노출 ✗, 내부 분기용 only]`,
    `  v2 sub-tier: ${tierResult.subTier} (subStep ${tierResult.subStep} / 학운 ${tierResult.hagunLabel})`,
    `  본문 표기: 학교명 + '안정·가능' 어휘만. '○티어'·'중상위권' 등 숫자/순위 표현 절대 ✗`,
    ``,
    ...(() => {
      // 코드 산출 안정·가능 chip 학교명 명시 — LLM 자체 판정 차단.
      // 옛 버전: "SHARED_UNIVERSITY_TIER_GUIDE 표의 sub-tier 행에서 학교명 추출" 으로
      // 표 전체 노출 → LLM이 다른 sub-tier 행 학교까지 임의 끌어옴 (학운 1-1 sample에
      // 영남대·계명대 4티어 노출 버그 fix).
      const groups = getTierSchoolGroups(tierResult.subTier);
      const lines: string[] = [
        `[§17 학교 권유 — 코드 산출 정확 명단 (이 외 학교 본문 노출 절대 ✗)]`,
      ];
      for (const g of groups) {
        lines.push(`  ${g.label}: ${g.schools.join(' · ')}`);
      }
      lines.push(
        `  ⚠️ 위 "안정·가능" 명단 외 학교명 절대 본문 인용 ✗ (학운에 ✗ 닿는 상위/하위 학교 권유 = 거짓 희망/절망).`,
        `  ⚠️ SHARED_UNIVERSITY_TIER_GUIDE 표의 다른 sub-tier 행 학교 끌어오기 ✗.`,
        `  ✅ 본문 패턴: "${groups[0]?.schools[0] ?? '서울대'}는 안정적으로 보여요" + 별도 트랙 (의약·예체능·사관·연구·해외) 은 적성/주력 점수 기준 분기.`,
        ``,
      );
      return lines;
    })(),
    ...(() => {
      // V13 외부변수 안내 분기: 비학자 격국 + 학자 본질 시그너 부재 = 사주만으로는 학업 영역 좁은 case.
      // 영진(07) 패턴: 사주 본질 ✗ + 본인 의지·외모·열정 같은 외부 자산이 결정 변수.
      // sample 영향: 영진·와이프·박진우·재원 등 = 점수 변동 ✗, LLM 톤에만 외부변수 인정 안내 추가.
      const hagunInfo = computeHagun(c);
      const isNonScholarCase = !hagunInfo.isScholar && NON_SCHOLAR_GYEOKGUK.has(c.gyeokguk.name);
      if (!isNonScholarCase) return [];
      return [
        `[외부변수 안내 모드 — 비학자 격국 + 학자 본질 시그너 부재. ${c.gyeokguk.name} + isScholar=false]`,
        `  사주만으로는 학업 영역이 좁은 명조. 본인 의지·열정·외모·기회·환경 같은 외부 자산이 학력의 결정 변수.`,
        `  §14 (한 마디) 톤: 정직 + 희망. "사주 본질만 보면 학업 영역이 좁아요. 그래도 자기 표현·자기 자리 잡는 힘은 강해요. 본인이 의지로 만들어가는 자리예요." 톤.`,
        `  §17 (학교) 톤: sub-tier ${tierResult.subTier} 학교명 본문 그대로 + 한 문장 추가 안내. 예시: "사주가 보여주는 자리는 여기예요. 본인이 의지·노력으로 ±2~3티어 위까지 가는 사주들도 있어요 — 사주는 본질만 보여드려요."`,
        `  거짓 희망 ✗ + 절망 ✗ 균형. 어머니에게 "노력으로 메꿔질 수 있는 가능 영역" 솔직 안내.`,
        ``,
      ];
    })(),
    `[주력 방향성 11가지 — 백엔드 결정성. 사회적 본업·전공의 큰 흐름. §3·§16·§17·§18 1차 baseline. 강도순 정렬, Top 2~3 메인, 그 다음 보통 등급 보조. 약은 본문 언급 ✗]`,
    `  ⚠️ 명명: 본문에 "주력 방향성" 사용 (이전 "방향성"·"진로 방향성"·"본업 방향성" 모두 → "주력 방향성"으로 통일)`,
    ...c.directions.map((d) =>
      `  ${d.emoji} ${d.label} — ${d.level}${d.recommendedFields.length > 0 ? ` (${d.recommendedFields.slice(0, 3).join(' · ')})` : ''}`,
    ),
    ``,
    `[대운 발현 시기 라벨 — V15 신규. 점수 보정 ✗, 발현 타이밍 안내 레이어. §11·§14·§18 활용]`,
    `  ${c.daewoonLabel.summary}`,
    `  ⚠️ 점수 자체 변경 ✗. "주력·적성 점수 X 이지만 청년기에 Y 시기로 발현된다" 식 시간 흐름 설명에만 활용.`,
    ``,
    `[격국 진로 매핑 — 백엔드 결정성 lookup. §16 2차 baseline. 1순위·2순위·이공계 대안 활용]`,
    `  격국: ${c.gyeokguk.name}`,
    `  1순위 진로: ${c.gyeokguk.careers.primary.join(' · ')}`,
    `  2순위 진로: ${c.gyeokguk.careers.secondary.join(' · ')}`,
    `  이공계 대안: ${c.gyeokguk.careers.engineering.join(' · ')}`,
    ``,
    `[적성 점수 — 예술·디자인 (artsScore). 주력 방향성 arts 카테고리와 cross-check 필수. 적성 ≠ 주력 = 부전공·취미 톤]`,
    `  ${c.artsScore.summary}`,
    (() => {
      const artsDir = c.directions.find((d) => d.key === 'arts');
      const dirLevel = artsDir?.level ?? '약';
      const arts = c.artsScore.level;
      // cross-check: 주력 방향성 arts level + 적성 점수 artsScore level 동시 고려.
      // 주력 = 격국·십성 통합 (본업 결정). 적성 = 신살 기반 세부 재능.
      // 주력 'arts' 가 약·보통 이면 적성 매우 강이라도 본업 권유 ✗ (취미·부전공만).
      if (arts === '매우 강' && (dirLevel === '강' || dirLevel === '매우 강')) {
        return `  주력 arts: ${dirLevel} → §16·§18 권유: **본업 예술·디자인 가능**. 학운 sub-tier 안에서 예술 학과 우선. 추천 학과: ${c.artsScore.recommendedFields.join(' / ')}. 학운 무시한 상위 예술대 권유 ✗.`;
      }
      if (arts === '매우 강' && dirLevel === '보통') {
        return `  주력 arts: 보통 → §16 권유: **본업 예술 ✗** (주력 Top 메인 권유 우선). 적성 예술 매우 강은 "감성·창의성 잘 활용한다·취미·부전공으로 빛난다" 톤으로 한 단락 언급. 추천 학과: ${c.artsScore.recommendedFields.join(' / ')} (부전공·복수전공 톤).`;
      }
      if (arts === '매우 강' && dirLevel === '약') {
        return `  주력 arts: 약 → §16 권유: 주력 Top 메인 권유. 적성 예술은 "취미·여가로 좋다" 한 줄만. 본업 권유 ✗.`;
      }
      if (arts === '강' && (dirLevel === '강' || dirLevel === '매우 강')) {
        return `  §16 권유: 격국 1순위와 함께 예술 학과도 명시. 학교는 학운 sub-tier 안에서. 추천 학과: ${c.artsScore.recommendedFields.join(' / ')}`;
      }
      if (arts === '강') {
        return `  주력 arts: ${dirLevel} → §16 권유: 격국 1순위 메인. 적성 예술은 부전공·취미 톤으로만 언급.`;
      }
      if (arts === '보통') {
        return `  §16 권유: 격국 lookup 기본. 취미·부전공 정도로 적성 예술 언급 가능.`;
      }
      return `  §16 권유: 격국 lookup만. 적성 예술 언급 ✗.`;
    })(),
    ``,
    `[적성 점수 — 의·약·치·생명과학 (medicalScore). 주력 방향성 medical 카테고리와 cross-check 필수]`,
    `  ${c.medicalScore.summary}`,
    c.medicalScore.level === '매우 강'
      ? `  §16·§18 권유: **학운 sub-tier 가 1-1 ~ 2-2 일 때만 의예·치의예·한의예·약대 직접 권유 가능**. 학운 2-3 이하면 의·약 본과 진학 어렵고, 생명과학·간호·물리치료·임상병리·보건 인접 학과로 분기. 추천: ${c.medicalScore.recommendedFields.join(' / ')}. 학운 무시한 의대 권유 ✗.`
      : c.medicalScore.level === '강'
        ? `  §16 권유: 학운 sub-tier 가 1-1 ~ 2-3 일 때만 의·약 자격직 명시. 그 외엔 생명과학·간호·보건 계열. 추천: ${c.medicalScore.recommendedFields.join(' / ')}`
        : c.medicalScore.level === '보통'
          ? `  §16 권유: 격국 lookup 기본. 의·약 자격직 가능성 한 줄 언급.`
          : `  §16 권유: 격국 lookup만. 의·약 언급 ✗.`,
    ``,
    `[적성 점수 — 연구·과기원 (researchScore). 주력 방향성 scholar+engineer 안에서 KAIST·POSTECH 분기]`,
    `  ${c.researchScore.summary}`,
    c.researchScore.level === '매우 강' || c.researchScore.level === '강'
      ? `  §17 권유: **학운 sub-tier 가 1-1 ~ 1-3 일 때 KAIST·POSTECH·UNIST·GIST·DGIST 우선 명시**. 학운 2-1 이하면 서울대 자연·공학 일반 또는 지방 거점 국립대 공학으로 분기. 추천: ${c.researchScore.recommendedFields.join(' / ')}.`
      : c.researchScore.level === '보통'
        ? `  §17 권유: 격국 lookup 기본. 연구·과기원 한 줄 언급 가능.`
        : `  §17 권유: 연구·과기원 언급 ✗ (격국 lookup 만).`,
    ``,
    `[적성 점수 — 공무·사관·경찰 (publicForceScore). 주력 방향성 authority 안에서 사관·경찰 분기]`,
    `  ${c.publicForceScore.summary}`,
    c.publicForceScore.level === '매우 강' || c.publicForceScore.level === '강'
      ? `  §17 권유: **학운 sub-tier 2-1 ~ 3-1 일 때 사관학교·경찰대 우선 명시**. 학운 그 외이면 일반 공무원·경찰·소방·교정 행정직으로 분기. 추천: ${c.publicForceScore.recommendedFields.join(' / ')}. 사관·경찰은 신체·체력 적성 필수 (사주만으론 결정 ✗).`
      : c.publicForceScore.level === '보통'
        ? `  §17 권유: 격국 lookup 기본. 일반 공무원·법조 언급 가능, 사관·경찰은 추가 신체 적성 조건부.`
        : `  §17 권유: 사관·경찰 본업 권유 ✗ (시그너 약함).`,
    ``,
    `[현재 학운 시기 — 백엔드 결정성. §13 "흐름" baseline]`,
    `  ${luckPhase.oneLineSummary}`,
    ``,
    ...(() => {
      const cr = calcCriticalYear({ childManse: c, birthYear: ctx.childBirthYear, grade: ctx.grade });
      if (!cr.worst) {
        return [
          `[조심해야 하는 한 해 — 학년대 내 위험 시그너 ≥2 없음. §18 본문 "큰 흔들림은 보이지 않아요" 1줄로 부드럽게 마무리]`,
          ``,
        ];
      }
      const w = cr.worst;
      const reasons = w.signals.map(s => s.reason).join(' / ');
      return [
        `[조심해야 하는 한 해 — 백엔드 결정성. §18 baseline. 점수·시그너 이름 본문 노출 ✗, 명리 근거만 자연 풀이]`,
        `  worst year: ${w.year}년 (만 ${w.age - 1}세) — 세운 ${w.sewunStem}${w.sewunBranch}`,
        `  카테고리: ${w.category}`,
        `  명리 근거: ${reasons}`,
        ``,
      ];
    })(),
    `[적성 점수 — 해외운 (abroadScore). 주력 방향성 global 카테고리와 cross-check. 점수·시그널 이름 본문 노출 ✗, 근거만 자연]`,
    `  ${c.abroadScore.summary}`,
    `  근거: ${c.abroadScore.signals.filter(s => s.matched).map(s => s.reason).join(' / ') || '시그널 없음 — 해외운 약'}`,
    `  §14 풀이 톤:`,
    c.abroadScore.level === '무조건'
      ? `    "해외에서 자리 잡는 게 자연스러워요"·"외국이 본토보다 운이 더 풀려요" 톤. 미·영국·캐나다·싱가포르 등 구체 국가 1~2곳.`
      : c.abroadScore.level === '강'
        ? `    "해외운이 강한 자리예요" 톤. 미·영국·캐나다 등 1~2곳.`
        : c.abroadScore.level === '보통'
          ? `    "해외도 가능성 열린 자리예요" 톤 (강요 ✗).`
          : `    "해외운은 약한 편이에요"·"국내가 자연스러워요" 톤.`,
    ``,
  ];

  return lines.filter(Boolean).join('\n');
}
