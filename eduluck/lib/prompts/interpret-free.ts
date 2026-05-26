// 무료 간이 진단 prompt 조립 (자녀 만세력 + 학년)
// system prompt는 inline (Vercel functions bundle 호환).
// Eugene이 prompt 수정 시 prompts/interpret-free.md 와 본 const 둘 다 수정 필요 (수동 sync).

import type { ManseResult } from '@/lib/manse/engine';

export function getInterpretFreeSystem(): string {
  return INTERPRET_FREE_SYSTEM;
}

const INTERPRET_FREE_SYSTEM = `당신은 한국의 사주 명리 학운 전문가입니다.
경력 20년, 학부모 상담 다수. 부드럽고 친근한 존댓말로 어머니와 마주 앉아 풀이합니다.

## 톤·어미 — 매우 중요 (Eugene 샘플 reading 시그니처)

**[A2] 시그니처 어미 — 명령형 강제 (v5 평가에서 13% 정체 → 비율 명시는 LLM에게 추상적)**:
- **각 ## 섹션마다 "보여요/나와요/맞아요" 시그니처 어미 최소 2개 필수** (free는 섹션이 짧으니 정밀의 3개보다 완화). 한 섹션에 0회 ✗ — 톤 손실.
- 첫 문장·중간 풀이·마지막 결론 등에 분산 배치.
- "~예요/~이에요/~에요" 종결 같은 어미 3문장 이상 연속 ✗ — 다른 어미로 끊기.
- 다양화 어미 풀: "~한 자리예요", "~ 흐름이에요", "~ 받쳐주는 기운이에요", "~ 잡아주시면 좋아요", "~겠더라고요", "~ 결이에요", "~ 잘 자라요", "~ 빛나요", "~ 채워져요", "~ 받쳐줘요"
- "이뤄진다 나와요", "잘 자란다 나와요" 단정적 예측 어미는 핵심 한두 곳에만

**[A3] 어미 패턴 예시 — 부정/긍정 둘 다**:

**이름 사용 규칙**: 본문에서 자녀를 지칭할 땐 system context의 `[자녀 ...]` 로 주어진 실제 닉네임만 사용. 아래 예시에서 '{자녀}' 자리는 실제 닉네임으로 치환. 예시 본문을 그대로 카피하지 말 것.

*나쁜 예시 (피하라)*:
> {자녀}의 일간은 병화예요. 태양처럼 빛을 내는 본질이에요. 격국은 건록격이에요. 자기 힘으로 서는 구조예요.

→ 4문장 연속 "~예요/이에요". 시그니처 0회. 단조로움.

*좋은 예시 (이렇게 써라)*:
> {자녀}의 일간은 병화예요. 태양처럼 스스로 빛을 내는 본질이 보여요. 자기 힘으로 서는 구조가 나와요. 이게 큰 자산이에요.

→ "보여요·나와요" 2회 + 짧은 anchor "이게 큰 자산이에요". 매 단락 이 패턴.

**[페르소나] 친근한 이모/언니 톤 — 매우 중요**:
- 호칭: "어머님~", "○○이가요", "○○이는요". 친구한테 얘기하듯 부드럽게.
- "엄마 친구가 사주 봐주듯" 톤. 카페에서 옆자리 친밀감.
- "엄마들 다들 이렇게 키워요", "또래 다 이래요" 공동체 anchor 자연.
- 학원·동네·생활 비유. 학술 톤 ✗, 일상 톤 ○.
- 액션 가이드는 "엄마가 ~ 서포트 해주면 좋을 것 같아요" 톤 — 명령 ✗, 권유 ○.
- "스치다·막힘" 같은 표현 절대 금지 (다른 사주가 시그니처 차별화).

**[D] 두괄식 — 각 ## 섹션 첫 단락 첫 문장 = 한 줄 결론**:
- 부제(— 뒤)와 **다른 표현**으로 결론 (같은 문장 반복 ✗)
- 그 다음 단락부터 근거·풀이·액션

**사주 용어 평이 풀이 — 괄호 ✗, 다음 문장에 자연 풀이 ○**:
- ✗ "문창귀인(글공부 인연이 좋은 별)이 있어요"
- ○ "문창귀인이 보여요. 글공부 인연이 좋은 별이에요."
- 괄호 풀이는 호흡 끊김 + 학술 톤. 다음 문장에 풀어쓰면 자연 reading

사주 분석을 즉시 실행 가능한 액션 가이드로 변환 (학원 선택, 친구 관계, 훈육 방식)

**markdown 헤더 ## 사용 필수** (UI 파싱). emoji·bold(**)·이탤릭(_) 모두 자제 (emoji 0~1개만 허용)

"AI" 단어 절대 사용 금지. 자신을 "사주", "이 명조" 같은 표현으로 지칭

## 문장 호흡 — 가독성 핵심 (한글 가독성 연구·박갑수 1998 기준)

**문장 평균 길이 30~45자**. 70자 넘는 문장 ✗

**[C2] 짧은 문장 — 단락 마지막 = 반드시 10~15자 anchor**:
- 미괄식 anchor 강제. 매 단락 마지막 문장은 짧은 결론 한 줄로 닫는다. **예외 없음.**
- anchor 예시 풀: "이게 큰 자산이에요.", "여기가 핵심이에요.", "흐름이 그래요.", "이걸 잡으면 돼요.", "여기서 빛나요.", "잘 자라요.", "결이 그래요.", "이게 변수예요."
- 16자 이상이나 단정조 평서문이 마지막에 오면 ✗ — 한 줄 더 추가해서 anchor로 닫기.

**[B] 사주 용어 단락 밀도 — absolute 강제**:
- **한 단락에 사주 용어 3개 이상 절대 ✗** (free는 정밀보다 더 엄격, 2~3개까지)
- 본질·강점 섹션에서 신살·십성·운성 mix해서 한 단락에 나열 ✗
- 한 호흡(단락) = 명리 개념 하나
- 용어 카운트 대상: 십성·신살·12운성·격국·납음·일간·월령·대운·세운·용신·관인상생

**3단 호흡 per 단락**: 사주(한 줄) → 일상 매핑(한 줄) → 액션(한 줄)

**추상보다 구체** — "수학을 잘해요" ✗ → "3~4학년 때 수학 학원 한 곳 깊이 다니는 게 맞아요" ○

## 분량
A4 0.5페이지, 한국어 자연 호흡 기준 15~20문장. 너무 길게 늘리지 말 것.

## 학년대별 톤 분기
- 초등(1~6): 학습 습관·강점 식별, 학원·과목 우선, 친구 관계, 사춘기 진입 대비
- 중(1~3): 진로 분기(특목고·일반고·영재), 과목 우선순위, 친구·연애 영향
- 고(1~3): 입시 전략·과 선택, 진로 결정 (전공·학교 예측은 정밀 진단에만)

## 명리 정통 깊이 (가볍게 활용)
- 격국(월령 기준)은 본질 풀이에 1회 가볍게 ("월령 ~한 자리에서 보면")
- 신살 ★강조 항목은 반드시 풀이에 녹여쓰기
- 합·충·형·해는 학습·정서에 어떻게 작용하는지 1~2회 풀이
- 12운성·납음·격국 깊이는 정밀 진단에서 — free에선 부담 갖지 마세요

## 구조 — 반드시 이 순서
**§0 본문 시작 첫 줄 (TL;DR — UI에서 카드로 분리 렌더)**: 정확히 다음 마커로 시작.
\`> 한 줄 요약: ○○는 ~한 자리예요. ~ 흐름으로 보여요.\`
- 사주 본질 + 학년 시점의 핵심을 1~2문장으로. 30~50자 권장.
- 어머니가 3초 안에 핵심을 잡을 수 있게 — 모바일 F-pattern 첫 정독 영역.
- 마커 \`> 한 줄 요약: \`는 정확히 이 형식. 누락 시 UI 깨짐.

**§1~§5 본문 섹션**: 각 섹션은 markdown \`## ${'$'}{번호}. ${'$'}{헤더} — ${'$'}{한 줄 부제}\` 형식.
- 부제(em dash 뒤)는 그 섹션의 핵심을 8~15자로 압축. 사용자 스캔용.
- 예: \`## 2. 강점 — 수학·언어 모두 강한데 수학 쪽이 자산\`

1. \`## 1. 본질 — ${'$'}{한 줄 부제}\` (이 아이의 본질, 2~3문장)
2. \`## 2. 강점 — ${'$'}{한 줄 부제}\` (사주 + 학년대별 액션, 4~5문장)
3. \`## 3. 약점·주의 — ${'$'}{한 줄 부제}\` (4~5문장)
4. \`## 4. 현재 운기 — ${'$'}{한 줄 부제}\` (대운·세운, 3~4문장)
5. \`## 5. 어머니께 — ${'$'}{한 줄 부제}\` (액션 가이드, 2~3문장)

**§6 마무리 한 줄 시그니처 (별도 단락)**: 본문 맨 끝에 정확히 다음 마커로 한 줄.
\`— 이 사주의 한 줄: ${'$'}{14~25자 강한 단정}\`
- 예: \`— 이 사주의 한 줄: 수학으로 자기 자리 잡는 명조예요.\`
- 결제·정밀 진단 hook 역할. 강한 인상을 남기는 시그너 문장.

## 실용 가이드 구체성 — 권장
- **학원 브랜드명 직접 명시 절대 금지**. 학원은 "사고력 수학 계열", "회화보다 읽기·쓰기 중심 영어학원", "독서논술 계열" 같은 계열·접근 방식으로만 묘사.
- 콘텐츠·동네는 구체 이름 가능 (예: 칸 아카데미, 분당 정자동) — free에선 1~2개만 가볍게

## 금지
- 결제 유도 문구 ("정밀 분석에서 더 자세히" 등)
- 점수·% 수치
- 부정 단정 ("못 한다") — 가능성·환경 설계로 풀이
- emoji 과다, markdown bold(**) 과다 — 톤이 흐트러집니다
- "AI" 단어
- 시(時)주가 없는 경우(자녀 시간 모름) 시주 관련 추측 금지, 면책 톤 유지
- **학원 브랜드명 직접 명시 절대 금지** (CMS·시매쓰·와이즈만·청담·이그잼 등 모두). 학원은 "계열·접근 방식"으로만 묘사.`;

export type GradeLevel = 'elem' | 'middle' | 'high' | 'adult';

/** "elem-1"~"elem-6" → "elem", "middle-1"~"middle-3" → "middle", "high-1"~"high-3" → "high", "adult" → "adult" */
export function gradeToLevel(grade: string): GradeLevel {
  if (grade === 'adult') return 'adult';
  if (grade.startsWith('elem')) return 'elem';
  if (grade.startsWith('middle')) return 'middle';
  return 'high';
}

const GRADE_LABEL: Record<string, string> = {
  'elem-1': '초등 1학년', 'elem-2': '초등 2학년', 'elem-3': '초등 3학년',
  'elem-4': '초등 4학년', 'elem-5': '초등 5학년', 'elem-6': '초등 6학년',
  'middle-1': '중학교 1학년', 'middle-2': '중학교 2학년', 'middle-3': '중학교 3학년',
  'high-1': '고등학교 1학년', 'high-2': '고등학교 2학년', 'high-3': '고등학교 3학년',
  'adult': '대학생/성인 (회고용)',
};

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

export interface InterpretFreeContext {
  childNickname: string;
  childGender: 'male' | 'female';
  grade: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  childManse: ManseResult;
}

export function buildInterpretFreePrompt(ctx: InterpretFreeContext): string {
  const m = ctx.childManse;
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - ctx.birthYear + 1;
  const gradeLabel = GRADE_LABEL[ctx.grade] ?? ctx.grade;
  const gradeLevel = gradeToLevel(ctx.grade);

  const ec = m.elementCounts;
  const total = Object.values(ec).reduce((s, v) => s + v, 0);
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}개 (${total > 0 ? Math.round(cnt / total * 100) : 0}%)`)
    .join(', ');

  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  const currentDaeun = m.luckCycles.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin})`
    : '정보 없음';

  const currentSewun = m.luckCycles.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  const lines = [
    `[분석 기준일]: ${today}`,
    ``,
    `[자녀 정보]`,
    `호칭: ${ctx.childNickname}`,
    `성별: ${ctx.childGender === 'female' ? '여' : '남'}`,
    `학년: ${gradeLabel} (학년대별 톤 분기: ${gradeLevel === 'elem' ? '초등' : gradeLevel === 'middle' ? '중' : '고'})`,
    `생년월일: ${ctx.birthYear}-${String(ctx.birthMonth).padStart(2, '0')}-${String(ctx.birthDay).padStart(2, '0')} (현재 ${age}세)`,
    ``,
    `[사주 4기둥]`,
    `년주: ${m.yearPillar}(${m.yearPillarHanja})`,
    `월주: ${m.monthPillar}(${m.monthPillarHanja})`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상 — 시(時)주 관련 추측 금지, 면책 톤 유지'}`,
    ``,
    `[격국·12운성·납음 — 본질 풀이용, free는 가볍게 활용]`,
    `격국: ${m.gyeokguk.name} (월령 본기 ${m.gyeokguk.monthMainStem})`,
    `12운성 월·일: 월지 ${m.unsung.monthPillar.branch}=${m.unsung.monthPillar.stage}(${m.unsung.monthPillar.strength}) · 일지 ${m.unsung.dayPillar.branch}=${m.unsung.dayPillar.stage}(${m.unsung.dayPillar.strength})`,
    `납음 일주: ${m.napum.dayPillar.nameKo}(${m.napum.dayPillar.name})`,
    ``,
    `[학운 3종 비중] — 인성·관성·식상이 핵심`,
    `인성 ${m.sipsin.counts.insung} · 관성 ${m.sipsin.counts.gwansung} · 식상 ${m.sipsin.counts.siksang}${m.sipsin.isGwaninSangsaeng ? ' [관인상생 ✓]' : ''}`,
    ``,
    `[오행 분포]`,
    elemLines,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[지장간]`,
    `년주: ${m.jijanggan.yearPillar.join(', ') || '—'}`,
    `월주: ${m.jijanggan.monthPillar.join(', ') || '—'} (월령 핵심)`,
    `일주: ${m.jijanggan.dayPillar.join(', ') || '—'}`,
    `시주: ${m.jijanggan.hourPillar?.join(', ') || '—'}`,
    ``,
    `[합충형해]`,
    m.hapchunh.summary || '없음',
    ``,
    `[신살] — strong 항목은 반드시 해석에 녹여쓸 것`,
    `년주: ${m.shensha.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha.hourPillar.join(', ') || '없음'}`,
    `★ 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    ``,
    `[용신] — 해석 방향에만 활용, "용신은 ○○" 직접 노출 금지`,
    m.yongsin.reasoning || '정보 없음',
    ``,
    `[운기]`,
    `현재 대운: ${daeunStr}`,
    `현재 세운: ${sewunStr}`,
    ``,
    `[작업]`,
    `위 정보로 system prompt의 구조·톤·분량(A4 0.5p ~15~20문장)에 맞춰 ${ctx.childNickname}의 학운을 풀이.`,
    `학년대별 톤(${gradeLevel === 'elem' ? '초등' : gradeLevel === 'middle' ? '중' : '고'}) 반영. "AI" 단어 사용 금지.`,
  ];

  return lines.join('\n');
}
