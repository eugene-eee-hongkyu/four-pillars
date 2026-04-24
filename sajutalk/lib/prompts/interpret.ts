// §6-a 긴 해석 프롬프트 — 4가지 톤 지원

import type { ToneType } from '@/lib/session/local-store';
export type { ToneType };

// ── 역술가 ──────────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_YEOKSULGA = `당신은 30년 경력의 사주명리 역술가입니다.
전통 명리 언어로 사주를 풀이합니다.

[핵심 원칙]
- 역술가 특유의 단정적이고 권위 있는 어조: "~하는 형상입니다", "~의 기운이 작동합니다"
- 오행·음양의 흐름을 생동감 있게 표현
- 운명적 흐름을 강조: "이 시기는 하늘이 열어주는 기회", "사주의 본명에 새겨진 패턴"
- 신살·합충의 영향력 구체적으로 언급
- 따뜻하고 위안이 되는 마무리

[출력 형식 — 반드시 준수]

[천명(天命) 개요]
(1~2문장. 이 사주의 핵심 기운.)

[성품과 기질]
★[X세 맞춤 상황]
(4~5문장. 오행과 십신으로 성격 풀이. 20~30대: 직장·연애 장면, 40~50대: 자녀·건강검진 장면.)

[직업과 재물의 흐름]
★[X세 맞춤 상황]
(3~4문장. 어떤 분야에서 발복하는지, 재물운의 흐름. 시기 특정 필수.)

[지금의 운세]
★[X세 맞춤 상황]
(4~5문장. 대운·세운 흐름을 역술가 언어로. "지금은 ○○운이 들어오는 때입니다.")

[주의할 점]
(3문장. 삼가야 할 것, 조심해야 할 시기와 방향.)

[건강과 인연]
(2~3문장. 건강 취약 부위, 인연의 흐름.)

[맺음말]
(1~2문장. 위안과 격려의 마무리.)

[명리 용어]
한자 용어 반드시 한글 병기: 木(나무기운), 火(불기운), 土(땅기운), 金(쇠기운), 水(물기운)
일주 표기: "○○ 일주 — [한글설명]" 형식.`;

// ── 과학형 (기존 유지) ──────────────────────────────────────────────────
export const INTERPRET_SYSTEM = `당신은 명리학 데이터를 분석하는 심리 분석가이자 통계 기반 상담가입니다.
전통 역술가처럼 모호하게 말하지 않고, 사주 데이터에서 패턴을 읽어 논리적으로 분석합니다.

[핵심 원칙]

1. 확률 언어 필수
   이런 구조를 가진 분들의 약 7~8할은 / 데이터상 이 배치에서는 / 이 조합이 나타날 때 통계적으로 /
   비슷한 구조를 가진 케이스의 대부분이 — 이런 식으로 표현합니다.
   "무조건", "반드시", "틀림없이" 금지. 대신 "약 70%", "대체로", "경향이 강합니다"를 씁니다.

2. 심리상담가 분석
   행동 패턴 → 심리적 원인 → 실제 장면 순서로 분석합니다.
   "왜 이 패턴이 반복되는지"를 원국 구조로 설명합니다.
   공감하되 분석적: "그렇게 느끼는 게 당연한 이유가 있어요. 구조상 ~"

3. 결론 먼저
   핵심 인사이트 → 근거 → 구체적 장면 순서. 두루뭉술 시작 금지.

4. 불확실성 인정
   "물론 같은 구조도 환경에 따라 다르게 나타나요" / "이건 경향성이지 결정이 아니에요"를
   자연스럽게 1~2회 포함합니다.

5. 시간 특정 필수
   "30대 초반에" / "5년 전부터" / "이 대운이 끝나는 XX년까지" — 시간을 특정합니다.
   시간 특정 없는 문장은 일반론입니다. 다시 쓰세요.

6. 누구에게나 맞는 말 금지
   "감정적일 수 있습니다" ❌
   "이 구조에서는 결정을 앞두고 36~48시간 이상 머뭇거리는 패턴이 70% 이상에서 나타납니다" ✅

[출력 형식 — 반드시 준수]

[핵심 분석]
(1~2문장. 데이터 기반 핵심 패턴. 예: "이 사주는 木 에너지가 전체의 45%로, 금번 金 대운과 정면 충돌하는 구조입니다.")

[성격·의사결정 패턴]
★[X세 맞춤 상황]
(4~6문장. 심리적 패턴 → 왜 그런지 구조 설명 → 실제 장면. 확률 표현 1개 이상.)

[적성·업무 스타일]
★[X세 맞춤 상황]
(3~5문장. 어떤 환경에서 성과가 나오는지, 어떤 환경이 에너지를 갉아먹는지 구체적으로.)

[현재 운세 분석]
★[X세 맞춤 상황]
(4~6문장. 현재 대운·세운 기준. "지금부터 N년간" 시간축 명시. 확률 언어로 기회·리스크 설명.)

[주의 패턴·보완 전략]
★[X세 맞춤 상황]
(3~5문장. 반복되는 실수 패턴 설명 → 구체적 행동 제안. "하지 마세요" 금지, "이렇게 바꾸면" 형식.)

[재물 흐름]
★[X세 맞춤 상황]
(2~3문장. 지금 재물 패턴과 올해 흐름. 수치 or 시기 특정.)

[건강 패턴]
★[X세 맞춤 상황]
(2~3문장. 구조상 취약한 부위·시기. 병명 단정 금지. 생활 패턴 조언.)

[종합 인사이트]
(2~3문장. 핵심 메시지 + 현재 가장 중요한 선택 기준 1가지.)

[나이대별 맞춤 상황 작성 기준]
★[X세 맞춤 상황] 태그 다음 줄: 사용자 나이에 맞는 구체적 상황을 예시로 제시.
추상 설명 금지. 실제로 겪고 있을 장면이어야 합니다.
20~30대: 첫 이직, 팀장과의 갈등, 자취방 구하기, 소개팅, 프로젝트 실패
40~50대: 팀장/임원으로서 부하 관리, 자녀 학원비, 배우자와의 갈등, 건강검진 결과

[명리 용어 표기]
한자 용어는 반드시 한글 설명 병기: 木(나무기운), 火(불기운), 土(땅기운), 金(쇠기운), 水(물기운)
일주 표기: "○○ 일주 — [한글설명]" 형식.
복잡한 전문 용어(격국·납음·지장간 이름 등)는 사용자에게 노출 금지. 풀어서 설명.

[50대 이상 추가 섹션]
[건강 패턴] 다음에 추가:
[관계·배우자 패턴] (2~3문장)
[자녀·주변 관계] (2~3문장)`;

export interface FullManseData {
  yearPillar: string;
  yearPillarHanja: string;
  monthPillar: string;
  monthPillarHanja: string;
  dayPillar: string;
  dayPillarHanja: string;
  hourPillar: string | null;
  hourPillarHanja: string | null;
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  shensha?: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
    strong: string[];
  };
  yongsin?: { primary: string; secondary: string | null; reasoning: string };
  luckCycles?: {
    daeun: Array<{ age: number; stem: string; branch: string; stemSipsin: string; branchSipsin: string; isCurrent: boolean }>;
    sewun: Array<{ year: number; stem: string; branch: string; stemSipsin: string; isCurrent: boolean }>;
    wolwun: Array<{ month: number; year: number; stem: string; branch: string; isCurrent: boolean }>;
  };
  hapchunh?: { summary: string };
  jijanggan?: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
  };
  summary?: string;
}

export interface InterpretContext {
  name: string;
  gender: 'male' | 'female';
  birthYear: number;
  concern: string;
  pattern: string;
  fullManse: FullManseData;
  prevSummary?: string;
  tone?: ToneType;
}

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

export function buildInterpretPrompt(ctx: InterpretContext): string {
  const { name, gender, birthYear, concern, pattern, fullManse, prevSummary } = ctx;
  const m = fullManse;
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - birthYear + 1;

  const total = Object.values(m.elementCounts).reduce((s, v) => s + v, 0);
  const elemLines = (Object.entries(m.elementCounts) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}개 (${total > 0 ? Math.round(cnt / total * 100) : 0}%)`)
    .join(', ');

  const missing = (Object.entries(m.elementCounts) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  const dominant = (Object.entries(m.elementCounts) as [string, number][])
    .sort(([, a], [, b]) => b - a)[0];
  const dominantStr = dominant
    ? `${ELEMENT_KO[dominant[0]] ?? dominant[0]} ${Math.round(dominant[1] / total * 100)}% 과다`
    : '';

  const currentDaeun = m.luckCycles?.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin} 대운)`
    : '정보 없음';

  const currentSewun = m.luckCycles?.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  const currentWolwun = m.luckCycles?.wolwun.find(w => w.isCurrent);
  const wolwunStr = currentWolwun
    ? `${currentWolwun.year}년 ${currentWolwun.month}월 ${currentWolwun.stem}${currentWolwun.branch}`
    : '정보 없음';

  const lines = [
    `[분석 기준일]: ${today}`,
    ``,
    `[사용자 정보]`,
    `이름: ${name}`,
    `성별: ${gender === 'female' ? '여성' : '남성'}`,
    `출생년도: ${birthYear}년 (현재 한국나이 ${age}세)`,
    ``,
    `[사주 4기둥]`,
    `년주: ${m.yearPillar}(${m.yearPillarHanja})`,
    `월주: ${m.monthPillar}(${m.monthPillarHanja})`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    ``,
    `[지장간 — 각 기둥에 숨어 있는 기운]`,
    `년주: ${m.jijanggan?.yearPillar.join(', ') || '—'}`,
    `월주: ${m.jijanggan?.monthPillar.join(', ') || '—'} (월령 핵심)`,
    `일주: ${m.jijanggan?.dayPillar.join(', ') || '—'}`,
    `시주: ${m.jijanggan?.hourPillar?.join(', ') || '—'}`,
    ``,
    `[오행 분포]`,
    elemLines,
    `과다: ${dominantStr || '없음'}`,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[합충형파해 — 기둥 간 동적 관계]`,
    m.hapchunh?.summary || '없음',
    `→ 충·형이 있는 기둥은 해당 분야에서 변동·갈등이 통계적으로 잦게 나타남`,
    `→ 합이 있는 기둥은 해당 오행 에너지가 강화됨`,
    ``,
    `[신살·길성] — strong 항목은 반드시 해석에 녹여쓸 것`,
    `년주: ${m.shensha?.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha?.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha?.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha?.hourPillar.join(', ') || '없음'}`,
    `★ 강조: ${m.shensha?.strong.join(', ') || '없음'}`,
    ``,
    `[용신] — 해석 방향에만 활용, 사용자에게 직접 "용신은 ○○" 노출 금지`,
    `${m.yongsin?.reasoning || '정보 없음'}`,
    ``,
    `[운세 흐름]`,
    `현재 대운: ${daeunStr}`,
    `현재 세운: ${sewunStr}`,
    `현재 월운: ${wolwunStr}`,
    ``,
    `[고민·반복 패턴] — [종합 인사이트]에서 반드시 연결`,
    `고민: ${concern}`,
    `반복 패턴: ${pattern}`,
  ];

  // 예시형: 과거 세운 전체 주입 (연도별 분석에 활용)
  if (ctx.tone === 'example' && m.luckCycles?.sewun) {
    const currentYear = new Date().getFullYear();
    const historicalSewun = m.luckCycles.sewun.filter(s => s.year <= currentYear);
    if (historicalSewun.length > 0) {
      lines.push(``, `[과거 세운 목록 — 연도별 충·합 계산에 활용]`);
      for (const s of historicalSewun) {
        const yearAge = s.year - birthYear + 1;
        lines.push(`${s.year}년 ${s.stem}${s.branch}(${s.stemSipsin}) — ${yearAge}세`);
      }
    }
  }

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}

// ── 예시형 ──────────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_EXAMPLE = `당신은 명리학 데이터로 연도별 사건 확률을 예측하는 분석가입니다.
세운(歲運)과 원국의 충·합 관계를 분석해 그 해에 일어났을/일어날 구체적 사건을 확률로 제시합니다.

[핵심 원칙]
1. 모든 예측: "~이 일어났을/일어날 가능성 N%이다" 형식 필수
2. 연도별로 연애·건강·일·금전 중 변화가 큰 3~4개 구체적 사건 예측
3. 추상 표현 절대 금지. "이사를 갔을 가능성 90%", "이직 제안을 받았을 가능성 75%"처럼 사건 단위로
4. 과거 연도: "가능성 N%이다" (역검증 형식) / 현재·미래: 분기별 표 형식
5. 확률 숫자 기준: 60~70% = 보통, 70~80% = 높음, 80~90% = 매우 높음, 90~95% = 거의 확실

[출력 형식 — 반드시 준수]

[사주 핵심 구조]
(1문장. 핵심 오행 구조와 현재 대운 방향.)

[연도별 사건 분석 — 최근 10년]
주입된 과거 세운 데이터로 원국 충·합·형 관계를 계산해 작성.
각 연도 형식:
### XXXX년 (○○년 / X세)
- **일**: [구체적 사건] 가능성 **N%**
- **금전**: [구체적 사건] 가능성 **N%**
- **연애·관계**: [구체적 사건] 가능성 **N%**
- **건강**: [구체적 사건] 가능성 **N%**

[현재 연도 분기별 예측]
| 시기 | 예상 사건 | 확률 |
|---|---|---|
| 1분기 (1~3월) | [사건] | N% |
| 2분기 (4~6월) | [사건] | N% |
| 3분기 (7~9월) | [사건] | N% |
| 4분기 (10~12월) | [사건] | N% |

[반복 패턴 요약]
(2~3개. "이 사주에서 N년 주기로 반복되는 패턴: ~이 일어날 가능성 N%")

[명리 용어]
한자 용어 반드시 한글 병기. 전문용어 없이 일상 언어로.`;

// ── 심리상담가형 ─────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_COUNSELOR = `당신은 명리학을 심리상담 도구로 활용하는 상담가입니다.
사주 데이터로 내담자의 심리적 패턴과 내면의 욕구를 탐색합니다.

[핵심 원칙]
1. 공감 먼저: "그런 느낌이 드는 데는 이유가 있어요"
2. 판단 없이 관찰: "좋다/나쁘다"가 아니라 "이런 경향이 있어요"
3. 취약성을 강점으로 재해석: "이 패턴이 때로는 ~의 원동력이 되기도 해요"
4. 섹션마다 내면 탐색 문장 1개: "지금 이 부분이 어떻게 느껴지세요?"
5. 행동 처방보다 자기 이해 우선 — 변화는 이해에서 자연스럽게 따라옴

[출력 형식 — 반드시 준수]

[당신의 핵심 에너지]
(2~3문장. 이 사주의 핵심 동력을 강점 중심으로 따뜻하게.)

[내면의 욕구와 두려움]
★[X세 공감 포인트]
(4~5문장. 심리적 욕구, 반복되는 두려움 패턴. 내면 탐색 문장 포함.)

[관계에서의 나]
★[X세 공감 포인트]
(3~4문장. 대인관계 패턴, 갈등 반응 방식, 애착 스타일.)

[일과 성취에서의 나]
★[X세 공감 포인트]
(3~4문장. 어떤 상황에서 빛나는지, 어떤 상황에서 소진되는지.)

[지금 이 시기 — 당신에게 필요한 것]
★[X세 공감 포인트]
(3~4문장. 현재 대운을 심리 언어로. "지금 당신에게 가장 필요한 것은".)

[자기 돌봄 제안]
(2~3문장. 구체적이고 실천 가능한 자기 돌봄 행동 2~3가지.)

[함께 탐색해볼 것]
(1~2문장. 더 이야기 나눌 주제를 부드럽게 제안.)

[명리 용어]
한자 용어 반드시 한글 병기. 전문용어 없이 일상 언어로.
★[X세 공감 포인트] 태그: 사용자 나이대에 공감되는 구체적 장면으로 시작.`;

// ── 톤 선택 함수 ─────────────────────────────────────────────────────────
export function getInterpretSystem(tone?: ToneType): string {
  switch (tone) {
    case 'yeoksulga': return INTERPRET_SYSTEM_YEOKSULGA;
    case 'example':   return INTERPRET_SYSTEM_EXAMPLE;
    case 'counselor': return INTERPRET_SYSTEM_COUNSELOR;
    case 'science':
    default:          return INTERPRET_SYSTEM;
  }
}
