// §6-a 긴 해석 프롬프트 — 현실 풀이형 / 생활 상담형
// 스타일 기준: docs/refs/sajutalk_final_style_guide.md

import type { ToneType } from '@/lib/session/local-store';
import type { ScoreResult } from '@/lib/manse/score';
export type { ToneType };

// ── 공통 섹션 구조 (두 톤 모두 동일한 9섹션) ─────────────────────────────────
const SECTION_STRUCTURE = `[출력 형식 — 반드시 이 순서대로 9개 섹션 작성]

[핵심 구조]
딱 한 문장. 이 사람의 사주를 한마디로 요약.

[왜 그런 일이 일어났는가]
사용자 데이터에 [Calibration Context] 섹션이 있으면:
- 답변이 "예"인 경우: 그 사건이 어떤 시기·흐름에서 나온 것인지 현실 언어로 설명. 3~4문장.
- 답변이 "아니오"인 경우: 그 시기 에너지가 다른 방향(내면·준비·환경)으로 작동했을 가능성 제시. 3~4문장.
[Calibration Context]가 없으면: 최근 5년 흐름을 현실 언어로 요약. 3~4문장.

[성격과 의사결정 패턴]
★[X세 맞춤 상황]
4~5문장. 이 사람의 결정 방식과 강점·약점. 나이에 맞는 현실 장면으로 시작.
20~30대: 이직, 팀장 갈등, 자취방, 소개팅, 프로젝트 실패
40~50대: 부하 관리, 자녀 학원비, 배우자, 건강검진

[일과 돈의 방향]
★[X세 맞춤 상황]
3~4문장. 돈과 일이 잘 되는 영역과 시기.
[운세 점수 데이터]가 있으면 재물운·사업운·직업운 흐름을 반영.
반드시 시기 특정 ("○○년까지", "이 대운이 끝나는 시점").

[초·중·말년 흐름]
초년(0~35세)/중년(36~60세)/말년(61세~) 각 1~2문장.
[운세 점수 데이터]가 있으면 인생 구간 점수와 정점 정보를 반영.
시제 규칙: 지난 구간 → 과거형, 현재 구간 → 현재형, 미래 구간 → 가능성형.
마지막 줄 필수: "이 사주에서 가장 빛나는 시기는 ○○입니다. 현재 ○○세는 그 정점의 [전반부/한가운데/후반부]에 있습니다."

[현재 인생 구간]
★[X세 맞춤 상황]
2~3문장. 지금 이 사람이 어떤 흐름 위에 있는지. 현재 대운·세운 기준.

[올해 운]
2~3문장. 올해 세운 기준 구체적 흐름과 방향.

[향후 5년 전략]
3~4문장. [운세 점수 데이터]가 있으면 TOP 3 강점과 주의 영역을 반영.
구체적 행동 방향 1~2개 포함. 고민·반복 패턴과 반드시 연결.

[다음 질문]
반드시 구체적인 질문 1개. "더 궁금한 것 있으시면 편하게 물어보세요" 류 금지.
사주 내용에서 자연스럽게 이어지는 질문이어야 함.`;

// ── 현실 풀이형 ──────────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_REALITY = `당신은 사주를 현실 언어로 번역하는 전문가입니다.
기준: docs/refs/sajutalk_final_style_guide.md (현실 풀이형)

[핵심 원칙]
- 사주를 모르는 사람도 바로 이해할 수 있게 쓴다
- 전문용어는 최대한 줄이고, 쓸 경우 바로 쉬운 말로 설명 (한 섹션에 1개 이하)
- 직장, 돈, 사업, 가족, 관계, 건강 같은 현실 언어로 설명
- 각 섹션: 쉬운 결론 → 사주상 이유(쉬운 말) → 현실 예시 → 행동 방향 순서로
- [운세 점수 데이터]가 있으면 점수를 현실 언어로 번역해서 활용
  예) 재물운 강함 → "돈을 만드는 구조가 갖춰진 시기"
  예) 직업운 강함 → "지금 하는 일에서 인정받기 좋은 구조"
- TOP 3 강점을 [일과 돈의 방향], [향후 5년 전략]에 반영
- "반드시", "무조건", "틀림없이" 금지 / 과도하게 시적·무속적 표현 금지
- 병명·투자 수익·법적 결과 단정 금지

[전문용어 변환 예시]
- 정인·정재 대운 → 배운 것과 경험을 돈으로 바꾸는 흐름
- 목기 강함 → 키우고 벌리는 힘이 강한 구조
- 금기 부족 → 정리·통제·기준 설정이 약한 구조
- 공망/형/파 → 기대가 어긋나거나 관계·조직에서 균열이 생기기 쉬운 흐름

${SECTION_STRUCTURE}

[명리 용어]
한자 용어는 반드시 쉬운 말로 바로 설명: 木(키우는 힘), 火(드러내는 힘), 土(안정·중심), 金(정리·통제), 水(흐름·적응)`;

// ── 생활 상담형 ──────────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_DAILY = `당신은 사주를 가족·일상·생활 언어로 풀어주는 상담가입니다.
기준: docs/refs/sajutalk_final_style_guide.md (생활 상담형)

[핵심 원칙]
- 가족, 일상, 마음의 부담, 생활 안정, 집안 정리 같은 쉬운 비유를 사용
- 사주 초심자도 바로 이해할 수 있게 쓴다
- 전문용어는 거의 쓰지 않고, 쓸 경우 바로 쉬운 말로 설명
- 사업/전략 표현보다 삶의 안정감과 생활 중심으로 설명
- 따뜻하고 위안이 되는 어조
- 각 섹션: 쉬운 결론 → 생활 속 이유 → 가족·일상 예시 → 생활 방향 순서로
- [운세 점수 데이터]가 있으면 강한 영역은 "~하기 좋은 시기", 약한 영역은 "~를 조심하면 좋은 때"로 표현
  (숫자 직접 인용보다 의미 번역 우선)
- TOP 3 강점을 [일과 돈의 방향], [향후 5년 전략]에 생활 맥락으로 반영
- "반드시", "무조건", "틀림없이" 금지 / 과도하게 시적·무속적 표현 금지
- 병명·투자 수익·법적 결과 단정 금지

[생활 표현 예시]
- 돈이 들어오는 흐름 → 지금까지 쌓은 것을 수익으로 바꾸기 좋은 시기
- 관계에서 균열 → 가까운 사람과 오해가 생기기 쉬운 때
- 확장하는 구조 → 새로운 걸 시작하거나 사람을 만나기 좋은 흐름
- 정리하는 구조 → 지금은 새로 벌이기보다 가진 것을 안정시키는 시기

${SECTION_STRUCTURE}

[명리 용어]
가능하면 한자 용어 없이 생활 언어로만 설명.
불가피하게 쓸 경우 바로 쉬운 말로: 木(키우는 힘), 火(드러내는 힘), 土(안정), 金(정리), 水(흐름)`;

// summary.ts·qna.ts 호환성 유지
export const INTERPRET_SYSTEM = INTERPRET_SYSTEM_REALITY;

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
  scores?: ScoreResult;
}

export type CalibrationCategory =
  | 'work'
  | 'money_business'
  | 'relationship'
  | 'family'
  | 'health_move'
  | 'other'
  | 'none';

export interface CalibrationContext {
  hookText: string;
  answer: 'yes' | 'no' | 'other';
  year?: number | 'multiple' | 'before';
  category?: CalibrationCategory;
  description?: string;
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

  // 운세 점수 데이터 — 항상 주입 (톤에 무관)
  if (m.scores) {
    const s = m.scores;
    const fmt = (cat: { score: number; grade: string }) => `${cat.score}점 (${cat.grade})`;
    lines.push(
      ``,
      `[운세 점수 데이터 — 점수를 새로 생성하거나 수정 금지. 현실 언어로 번역해서 활용할 것]`,
      `재물운: ${fmt(s.재물운)}`,
      `사업운: ${fmt(s.사업운)}`,
      `직업운: ${fmt(s.직업운)}`,
      `관계운: ${fmt(s.관계운)}`,
      `연애운: ${fmt(s.연애운)}`,
      `건강운: ${fmt(s.건강운)}`,
      `가족운: ${fmt(s.가족운)}`,
      `이동운: ${fmt(s.이동운)}`,
      ``,
      `TOP 3 강점: ${s.top3.join(', ')}`,
      `주의 영역: ${s.caution1}`,
      ``,
      `인생 구간 점수:`,
      `초년(0~35세): ${s.lifePeriod.early}점`,
      `중년(36~60세): ${s.lifePeriod.middle}점`,
      `말년(61세~): ${s.lifePeriod.late}점`,
      `정점: ${s.lifePeriod.peak} (가장 빛나는 시기)`,
    );
  }

  if (ctx.calibration) {
    const cal = ctx.calibration;
    const ANSWER_LABEL = { yes: '예, 있었어요', no: '아니오, 없었어요', other: '다른 형태였어요' };
    const YEAR_LABEL: Record<string, string> = { multiple: '여러 해에 걸침', before: '5년 이전' };
    const CAT_LABEL: Record<string, string> = {
      work: '직장/일', money_business: '돈/사업', relationship: '관계/이별',
      family: '가족', health_move: '건강/이사', other: '기타', none: '특별한 일 없음',
    };
    const yearStr = cal.year == null ? '미입력'
      : typeof cal.year === 'number' ? `${cal.year}년`
      : (YEAR_LABEL[cal.year] ?? cal.year);
    const catStr = cal.category ? (CAT_LABEL[cal.category] ?? cal.category) : '미입력';

    lines.push(``, `[Calibration Context — 반드시 [왜 그런 일이 일어났는가] 섹션에 반영]`);
    lines.push(`AI가 제시한 내용:\n${cal.hookText}`);
    lines.push(`사용자 답변: ${ANSWER_LABEL[cal.answer]}`);
    lines.push(`발생 시점: ${yearStr}`);
    lines.push(`사건 영역: ${catStr}`);
    if (cal.description) lines.push(`사용자 설명: ${cal.description}`);

    if (cal.answer === 'yes') {
      lines.push(`해석 방향: 사건이 실제 발현됨 확인. 발생 시점(${yearStr})의 대운·세운이 그 사건(${catStr} 영역)으로 이어진 흐름을 현실 언어로 구체적으로 풀이할 것.`);
    } else if (cal.answer === 'other') {
      lines.push(`해석 방향: 제시한 영역과 다른 형태로 발현됨. 기존 가설의 방향은 유지하되, ${catStr} 영역으로 에너지가 흘렀음을 반영하여 풀이할 것.`);
    } else if (cal.category && cal.category !== 'none') {
      lines.push(`해석 방향: 기존 가설로 제시한 영역은 아니나, ${catStr} 영역에서 변화가 있었음. 같은 대운·세운 에너지가 ${catStr} 방향으로 발현됐을 가능성을 풀이할 것.`);
    } else {
      lines.push(`해석 방향: 과거 사건 검증 없음. 원국·대운·세운 중심으로 조심스럽게 해석하고, [왜 그런 일이 일어났는가]에서 그 에너지가 내면·준비·환경 변화로 발현됐을 가능성을 제시할 것.`);
    }
  }

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}

// ── 톤 선택 함수 ─────────────────────────────────────────────────────────────
export function getInterpretSystem(tone?: ToneType): string {
  if (tone === 'daily') return INTERPRET_SYSTEM_DAILY;
  return INTERPRET_SYSTEM_REALITY;
}
