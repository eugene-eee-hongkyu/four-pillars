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
- 답변이 "예"인 경우: 그 사건이 어떤 시기·흐름에서 나온 것인지 설명. 3~4문장.
- 답변이 "아니오"인 경우: 그 시기 에너지가 다른 방향(내면·준비·환경)으로 작동했을 가능성 제시. 3~4문장.
[Calibration Context]가 없으면: 최근 5년 흐름을 요약. 3~4문장.

[성격과 의사결정 패턴]
★[X세 맞춤 상황]
4~5문장. 이 사람의 결정 방식과 강점·약점. 나이에 맞는 현실 장면으로 시작.
20~30대: 이직, 팀장 갈등, 자취방, 소개팅, 프로젝트 실패
40~50대: 부하 관리, 자녀 학원비, 배우자, 건강검진

[일과 돈의 방향]
★[X세 맞춤 상황]
3~4문장. [운세 점수 데이터]가 있으면 재물운·사업운·직업운 흐름을 이 톤의 관점으로 반영.
반드시 시기 특정 ("○○년까지", "이 대운이 끝나는 시점").

[초·중·말년 흐름]
초년(0~35세)/중년(36~60세)/말년(61세~) 각 1~2문장.
[운세 점수 데이터]가 있으면 인생 구간 등급과 정점 정보를 반영.
시제 규칙: 지난 구간 → 과거형, 현재 구간 → 현재형, 미래 구간 → 가능성형.
마지막 줄 필수: 제공된 [인생 정점 표현]을 그대로 사용할 것.

[현재 인생 구간]
★[X세 맞춤 상황]
2~3문장. 지금 이 사람이 어떤 흐름 위에 있는지. 현재 대운·세운 기준.

[올해 운]
2~3문장. 올해 세운 기준 구체적 흐름과 방향.

[향후 5년 전략]
3~4문장. [운세 점수 데이터]가 있으면 TOP 3 강점과 주의 영역을 이 톤의 관점으로 반영.
구체적 행동 방향 1~2개 포함. 고민·반복 패턴과 반드시 연결.

[다음 질문]
반드시 구체적인 질문 1개. "더 궁금한 것 있으시면 편하게 물어보세요" 류 금지.
사주 내용에서 자연스럽게 이어지는 질문이어야 함.`;

// ── 공통 자기검증 규칙 ────────────────────────────────────────────────────────
const SELF_VALIDATE = `[출력 전 자기검증 — 반드시 확인 후 출력]
- 점수와 표현이 충돌하지 않는지 확인한다.
- 60점 이하에는 "강하다", "좋다", "빛난다", "정점" 같은 표현을 쓰지 않는다.
- 70점 이상일 때만 "강하다"라고 표현한다.
- 80점 이상일 때만 "매우 강하다"라고 표현한다.
- TOP 3는 실제 점수가 높은 항목만 선택한다. 낮은 점수 항목을 강점으로 쓰지 않는다.
- 문장과 점수가 충돌하면 점수에 맞춰 문장을 낮춘다.
- [인생 정점 표현]에 제공된 문구를 그대로 사용하고 임의로 "빛나는 시기"를 추가하지 않는다.`;

// ── 현실 풀이형 ──────────────────────────────────────────────────────────────
// 관점: 대표·직업인·사업가 — 사업 구조, 돈의 흐름, 조직, 리더십, 의사결정, 실행 전략 중심
export const INTERPRET_SYSTEM_REALITY = `당신은 사주 데이터를 바탕으로 사업·커리어·재무 전략을 분석하는 전문가입니다.

[관점 — 반드시 준수]
대표·직업인·사업가 관점으로 읽는다.
모든 섹션을 아래 주제 중심으로 풀어쓴다:
  사업 구조 / 돈의 흐름 / 조직 운영 / 리더십 / 의사결정 / 실행 전략

가족 비유, 마음의 짐, 생활 안정, 일상 회복 같은 표현은 최소화한다.

[표현 기준]
- 사주를 모르는 사람도 바로 이해할 수 있게 쓴다
- 전문용어를 쓸 경우 바로 사업·커리어 언어로 변환 (한 섹션에 1개 이하)
- [운세 점수 데이터]가 있으면 각 운을 사업·커리어·재무 맥락으로 번역
  예) 재물운 강함 → "수익이 만들어지는 구조가 갖춰진 시기"
  예) 직업운 강함 → "지금 하는 일에서 성과와 인정이 나오기 좋은 흐름"
  예) 사업운 약함 → "외형 확장보다 내실 정리가 맞는 시기, 사람을 더 쓰는 것보다 시스템화가 먼저"
  예) 관계운 → "파트너십, 거래처, 팀 내 신뢰 관계로 해석"
- TOP 3 강점을 [일과 돈의 방향], [향후 5년 전략]에 사업·커리어 맥락으로 반영
- "반드시", "무조건", "틀림없이" 금지
- 투자 수익·법적 결과 단정 금지

[좋은 표현 예시]
- 지금은 새 사업을 벌이기보다 기존 수익 구조를 다지는 흐름
- 이 구조에서는 혼자 다 하는 방식보다 역할 분리와 위임이 맞다
- 이 대운에서 외형 확장은 현금 흐름을 위험하게 만들 수 있다
- 확장보다 압축 — 적은 사람으로 돌아가는 시스템이 더 잘 맞는 구조
- 기획·세일즈보다 운영·유지에 에너지를 집중해야 하는 흐름

${SECTION_STRUCTURE}

${SELF_VALIDATE}

[명리 용어 변환]
한자 용어는 사업·커리어 언어로 바로 설명: 木(키우고 확장하는 힘), 火(드러내고 팔리는 힘), 土(안정과 기반), 金(정리와 통제), 水(유연성과 흐름·적응)`;

// ── 생활 상담형 ──────────────────────────────────────────────────────────────
// 관점: 개인의 삶·가족·일상 안정 — 마음 부담, 가족 안정, 관계 피로, 생활 리듬 중심
export const INTERPRET_SYSTEM_DAILY = `당신은 사주 데이터를 바탕으로 마음·가족·일상 안정을 중심으로 풀어주는 상담가입니다.

[관점 — 반드시 준수]
개인의 삶·가족·일상 안정 관점으로 읽는다.
모든 섹션을 아래 주제 중심으로 풀어쓴다:
  마음의 부담 / 가족과 집의 안정감 / 관계에서 지치지 않는 법 / 생활 리듬 / 건강한 거리두기 / 무리하지 않는 선택

사업 전략, 조직 설계, 수익 모델, 리더십 표현은 최소화하고 꼭 필요할 때만 쉽게 풀어쓴다.

[표현 기준]
- 사주 초심자도 바로 이해할 수 있게 쓴다
- 전문용어는 거의 쓰지 않고, 쓸 경우 생활 언어로 바로 설명
- 따뜻하고 위안이 되는 어조
- [운세 점수 데이터]가 있으면 각 운을 마음·생활·관계 맥락으로 번역
  예) 재물운 강함 → "꾸준히 쌓은 것이 조금씩 결실로 돌아오는 흐름"
  예) 관계운 강함 → "지금은 사람들과 어울리면서 에너지를 충전하기 좋은 흐름"
  예) 건강운 약함 → "몸 신호에 귀 기울이고 무리한 약속은 줄이는 게 좋은 시기"
  예) 이동운 → "이사, 여행, 환경 변화로 해석"
- TOP 3 강점을 [일과 돈의 방향], [향후 5년 전략]에 생활·가족 맥락으로 반영
- "반드시", "무조건", "틀림없이" 금지
- 병명 단정 금지

[좋은 표현 예시]
- 지금은 새로 시작하기보다 지금 있는 것을 지키고 회복하는 흐름
- 가까운 사람과의 관계에서 에너지를 잃지 않으려면 적당한 거리가 필요한 시기
- 무리해서 끌고 가기보다 속도를 조절하는 것이 건강한 선택
- 가족과 함께하는 시간이 오히려 지친 마음을 채워주는 구조
- 주변 기대에 맞추느라 내가 원하는 것을 미루는 패턴에서 벗어나는 것이 먼저

${SECTION_STRUCTURE}

${SELF_VALIDATE}

[명리 용어 변환]
가능하면 한자 용어 없이 생활 언어로만 설명.
불가피하게 쓸 경우: 木(뻗어나가는 힘), 火(드러내는 힘), 土(안정), 金(정리), 水(흐름)`;

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

// 인생 구간 점수를 숫자 대신 설명 등급으로 변환 (LLM의 점수↔표현 충돌 방지)
function lifePeriodGrade(score: number): string {
  if (score >= 75) return '성취와 성장이 큰 구간';
  if (score >= 65) return '안정적이고 성과가 나오는 구간';
  if (score >= 55) return '평범한 흐름의 구간';
  if (score >= 45) return '에너지 관리가 필요한 구간';
  return '신중하게 지켜야 하는 구간';
}

// 정점 표현 — 실제 점수 기준으로 과장 방지
function peakExpression(peakPeriod: '초년' | '중년' | '말년', peakScore: number): string {
  const period = peakPeriod === '초년' ? '초년' : peakPeriod === '중년' ? '중년' : '말년';
  if (peakScore >= 70) {
    return `이 사주에서 가장 빛나는 시기는 ${period}입니다.`;
  }
  if (peakScore >= 60) {
    return `이 사주에서 상대적으로 가장 안정되는 구간은 ${period}입니다.`;
  }
  return `이 사주에서 세 구간 중 상대적으로 나은 흐름은 ${period}입니다.`;
}

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

  // 운세 점수 — 항상 주입 (톤 무관). lifePeriod는 등급 표현으로 변환해 충돌 방지.
  if (m.scores) {
    const s = m.scores;
    const fmt = (cat: { score: number; grade: string }) => `${cat.score}점 (${cat.grade})`;

    const peakScore = s.lifePeriod.peak === '초년' ? s.lifePeriod.early
      : s.lifePeriod.peak === '중년' ? s.lifePeriod.middle
      : s.lifePeriod.late;

    lines.push(
      ``,
      `[운세 점수 데이터 — 점수를 새로 생성하거나 수정 금지. 이 톤의 관점으로 번역해서 활용할 것]`,
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
      `[인생 구간 등급 — 숫자 직접 인용 금지, 아래 표현을 그대로 활용할 것]`,
      `초년(0~35세): ${lifePeriodGrade(s.lifePeriod.early)}`,
      `중년(36~60세): ${lifePeriodGrade(s.lifePeriod.middle)}`,
      `말년(61세~): ${lifePeriodGrade(s.lifePeriod.late)}`,
      ``,
      `[인생 정점 표현 — 이 문장을 [초·중·말년 흐름] 마지막 줄에 그대로 사용할 것]`,
      peakExpression(s.lifePeriod.peak, peakScore),
      `현재 ${age}세는 그 [전반부/한가운데/후반부] 중 하나를 선택해 채울 것.`,
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
      lines.push(`해석 방향: 사건이 실제 발현됨 확인. 발생 시점(${yearStr})의 대운·세운이 그 사건(${catStr} 영역)으로 이어진 흐름을 현실 언어로 풀이할 것.`);
    } else if (cal.answer === 'other') {
      lines.push(`해석 방향: 제시한 영역과 다른 형태로 발현됨. 기존 가설의 방향은 유지하되, ${catStr} 영역으로 에너지가 흘렀음을 반영하여 풀이할 것.`);
    } else if (cal.category && cal.category !== 'none') {
      lines.push(`해석 방향: 기존 가설로 제시한 영역은 아니나, ${catStr} 영역에서 변화가 있었음. 같은 대운·세운 에너지가 ${catStr} 방향으로 발현됐을 가능성을 풀이할 것.`);
    } else {
      lines.push(`해석 방향: 과거 사건 검증 없음. 원국·대운·세운 중심으로 조심스럽게 해석하고, 그 에너지가 내면·준비·환경 변화로 발현됐을 가능성을 제시할 것.`);
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
