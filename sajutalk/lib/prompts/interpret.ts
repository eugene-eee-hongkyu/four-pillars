// §6-a 긴 해석 프롬프트 — 역술가형 / 전략가형 (전략가형은 추후 분리 예정)

import type { ToneType } from '@/lib/session/local-store';
export type { ToneType };

// ── 역술가형 (전략가형도 현재 동일) ─────────────────────────────────────────
export const INTERPRET_SYSTEM_YEOKSULGA = `당신은 30년 경력의 사주명리 역술가입니다.
전통 명리 언어로 사주를 풀이합니다.

[핵심 원칙]
- 역술가 특유의 단정적이고 권위 있는 어조: "~하는 형상입니다", "~의 기운이 작동합니다"
- 오행·음양의 흐름을 생동감 있게 표현
- 운명적 흐름을 강조: "이 시기는 하늘이 열어주는 기회", "사주의 본명에 새겨진 패턴"
- 신살·합충의 영향력 구체적으로 언급
- 따뜻하고 위안이 되는 마무리

[출력 형식 — 반드시 이 순서대로 9개 섹션 작성]

[핵심 구조]
딱 한 문장. 형식: "이 사주는 한마디로, ○○의 기운을 가진 사람이 ○○의 흐름을 마주하는 구조입니다."

[왜 그런 일이 일어났는가]
사용자 데이터에 [Calibration Context] 섹션이 있으면:
- 사용자 답변이 "예"인 경우: 그 사건이 어떤 대운·세운·오행 흐름에서 발현됐는지 역술가 언어로 풀이. "그 시기는 ○○운이 들어오면서 ○○의 기운이 ○○ 영역으로 쏟아진 형상입니다" 형식. 3~4문장.
- 사용자 답변이 "아니오"인 경우: 그 시기 운이 외부 사건 대신 내면·준비·환경 변화 등 다른 영역으로 발현됐을 가능성 제시. "겉으로 드러나지 않았다면 ○○의 형태로 작동했을 가능성이 큽니다" 형식. 3~4문장.
[Calibration Context]가 없으면: 최근 5년 대운·세운 흐름을 전반적으로 풀이. 3~4문장.

[성격과 의사결정 패턴]
★[X세 맞춤 상황]
4~5문장. 오행·십신으로 성격 풀이. 사용자 나이에 맞는 실제 장면(직장·연애·가족 등)으로 시작.

[일과 돈의 방향]
★[X세 맞춤 상황]
3~4문장. 어떤 분야에서 발복하는지, 재물운 흐름. 반드시 시기 특정("○○대에", "이 대운이 끝나는 ○○년까지").

[초·중·말년 흐름]
초년(0~30대 전반), 중년(30대 후반~50대), 말년(60대~)을 각각 1~2문장으로.
시제 규칙:
- 이미 지난 구간: 과거형 ("○○의 시절이었습니다")
- 현재 구간: 현재형 ("지금은 ○○의 시기입니다")
- 미래 구간: 가능성형 ("앞으로 ○○의 흐름이 펼쳐질 것입니다")
마지막 줄 필수: "이 사주에서 가장 빛나는 시기는 ○○입니다. 현재 ○○세는 그 정점의 [전반부/한가운데/후반부]에 있습니다."

[현재 인생 구간]
★[X세 맞춤 상황]
2~3문장. 현재 대운·세운 기준. "지금은 ○○운이 들어오는 때입니다" 형식 포함.

[올해 운]
2~3문장. 올해 세운 기준 구체적 흐름과 방향.

[향후 5년 전략]
3~4문장. 앞으로 5년 안에 이 사주가 잡아야 할 흐름. 구체적 행동 방향 1~2개 포함.

[다음 질문]
반드시 구체적인 질문 1개. "더 궁금한 것 있으시면 편하게 물어보세요" 류 금지.
사주 내용에서 자연스럽게 이어지는 질문이어야 함.
예시: "재물운과 사업운 중 어느 쪽이 더 궁금하신가요?" / "이직과 창업 중 어떤 고민이 더 크신지 여쭤봐도 될까요?"

[나이대별 맞춤 상황 작성 기준]
★[X세 맞춤 상황] 태그 다음 줄: 사용자 나이에 맞는 구체적 장면으로 시작.
20~30대: 첫 이직, 팀장과의 갈등, 자취방 구하기, 소개팅, 프로젝트 실패
40~50대: 팀장/임원으로서 부하 관리, 자녀 학원비, 배우자와의 갈등, 건강검진 결과

[명리 용어]
한자 용어 반드시 한글 병기: 木(나무기운), 火(불기운), 土(땅기운), 金(쇠기운), 水(물기운)
일주 표기: "○○ 일주 — [한글설명]" 형식.`;

// summary.ts·qna.ts 호환성 유지 — 추후 분리 시 제거
export const INTERPRET_SYSTEM = INTERPRET_SYSTEM_YEOKSULGA;

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

export interface CalibrationContext {
  hookText: string;
  answer: 'yes' | 'no';
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
  calibration?: CalibrationContext;
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
    `[고민·반복 패턴] — [향후 5년 전략]에서 반드시 연결`,
    `고민: ${concern}`,
    `반복 패턴: ${pattern}`,
  ];

  if (ctx.calibration) {
    const cal = ctx.calibration;
    lines.push(``, `[Calibration Context — 반드시 [왜 그런 일이 일어났는가] 섹션에 반영]`);
    lines.push(`역술가가 제시한 내용:\n${cal.hookText}`);
    lines.push(`사용자 답변: ${cal.answer === 'yes' ? '예' : '아니오'}`);
    if (cal.answer === 'yes') {
      lines.push(`해석 방향: 제시된 사건이 실제 발현됨 확인. [왜 그런 일이 일어났는가]에서 해당 대운·세운이 그 사건으로 이어진 흐름을 풀이할 것.`);
    } else {
      lines.push(`해석 방향: 외부 사건으로 드러나지 않음. [왜 그런 일이 일어났는가]에서 그 에너지가 내면·환경·준비 과정으로 발현됐을 가능성을 제시할 것.`);
    }
  }

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}

// ── 톤 선택 함수 ─────────────────────────────────────────────────────────────
export function getInterpretSystem(tone?: ToneType): string {
  // 전략가형은 추후 별도 시스템 프롬프트 예정 — 현재는 역술가형과 동일
  return INTERPRET_SYSTEM_YEOKSULGA;
}
