// §6-a 긴 해석 프롬프트 — 역술가형 / 전략가형

import type { ToneType } from '@/lib/session/local-store';
import type { ScoreResult } from '@/lib/manse/score';
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

// ── 전략가형 ─────────────────────────────────────────────────────────────────
export const INTERPRET_SYSTEM_STRATEGIST = `당신은 동양 명리학과 현대 전략적 사고를 결합한 사주 분석 전문가입니다.
백엔드에서 계산된 운세 점수를 기반으로 분석합니다.

[핵심 원칙]
- [운세 점수 데이터] 섹션의 점수·등급을 그대로 사용. 점수를 새로 생성하거나 수정 금지.
- 분석적이고 명확한 어조: "데이터에 따르면", "이 사주 구조는 ~를 나타냅니다"
- 구체적 수치와 시기를 명시: "직업운 82점(강함)은 ~을 의미합니다"
- 강점은 전략적 기회로, 약점은 리스크 관리 방안으로 제시
- TOP 3 강점과 주의 영역을 반드시 분석에 녹일 것

[출력 형식 — 반드시 이 순서대로 12개 섹션 작성]

[핵심 구조]
딱 한 문장. 형식: "이 사주는 ○○의 구조로, ○○에서 강점을 발휘하고 ○○에서 주의가 필요한 형국입니다."

[운세 종합 분석]
제공된 8개 운세 점수 기반 전체 평가. 2~3문장.
반드시 TOP 3 강점과 주의 영역 1개를 언급.
"가장 강한 영역은 ○○(○점)이며, 주의가 필요한 영역은 ○○(○점)입니다" 형식 포함.

[재물·사업 전략]
재물운·사업운 점수 기반. 3~4문장.
점수와 등급을 명시하고 구체적 전략 방향 제시.
반드시 시기 특정("○○대운이 끝나는 ○○년까지", "현재 세운 기준").

[커리어·직업 전략]
직업운 점수 기반. 3~4문장.
현재 대운·세운과 연결하여 커리어 방향 제시.

[관계·연애 분석]
관계운·연애운 점수 기반. 3~4문장.
성별에 맞는 분석 (점수에 이미 성별 보정 반영됨).

[건강·이동 관리]
건강운·이동운 점수 기반. 2~3문장.
점수가 낮은 영역은 구체적 관리 방안 제시.

[가족 관계]
가족운 점수 기반. 2~3문장.

[성격과 의사결정 패턴]
★[X세 맞춤 상황]
4~5문장. 오행·십신 구조에서 드러나는 의사결정 성향 분석.

[인생 구간 분석]
초년(0~35세)/중년(36~60세)/말년(61세~) 구간별 점수를 명시하고 각 1~2문장 분석.
시제 규칙:
- 이미 지난 구간: 과거형 ("○○점으로 ○○의 시절이었습니다")
- 현재 구간: 현재형 ("현재 ○○점 구간입니다")
- 미래 구간: 가능성형 ("앞으로 ○○점 수준의 흐름이 펼쳐질 것입니다")
마지막 줄 필수: "이 사주의 정점은 ○○입니다. 현재 ○○세는 그 정점의 [전반부/한가운데/후반부]에 있습니다."

[현재 대운·세운 기회]
현재 대운·세운 기반. 2~3문장.
지금 어떤 기회와 리스크가 있는지 전략적으로 분석.

[향후 5년 액션 플랜]
3~4문장. 구체적 행동 항목 2~3개 포함. 고민·반복 패턴과 반드시 연결.

[다음 질문]
반드시 구체적인 질문 1개. "더 궁금한 것 있으시면 편하게 물어보세요" 류 금지.
8개 운세 중 사용자 고민과 가장 관련 깊은 영역에서 자연스럽게 이어지는 질문.

[나이대별 맞춤 상황 작성 기준]
★[X세 맞춤 상황] 태그: 사용자 나이에 맞는 구체적 상황으로 시작.
20~30대: 이직, 팀장 갈등, 창업 고민, 연애
40~50대: 임원/팀장 역할, 자녀, 배우자, 건강검진

[명리 용어]
한자 용어 반드시 한글 병기: 木(나무기운), 火(불기운), 土(땅기운), 金(쇠기운), 水(물기운)`;

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

  if (ctx.tone === 'strategist' && m.scores) {
    const s = m.scores;
    const GRADE_KO: Record<string, string> = {
      '매우강함': '매우강함', '강함': '강함', '보통': '보통', '약함': '약함', '매우약함': '매우약함',
    };
    const fmt = (cat: { score: number; grade: string }) =>
      `${cat.score}점 (${GRADE_KO[cat.grade] ?? cat.grade})`;
    lines.push(
      ``,
      `[운세 점수 데이터 — 이 숫자를 그대로 사용할 것. LLM이 점수를 새로 생성하거나 수정 금지]`,
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
    lines.push(`역술가가 제시한 내용:\n${cal.hookText}`);
    lines.push(`사용자 답변: ${ANSWER_LABEL[cal.answer]}`);
    lines.push(`발생 시점: ${yearStr}`);
    lines.push(`사건 영역: ${catStr}`);
    if (cal.description) lines.push(`사용자 설명: ${cal.description}`);

    if (cal.answer === 'yes') {
      lines.push(`해석 방향: 사건이 실제 발현됨 확인. 발생 시점(${yearStr})의 대운·세운이 그 사건(${catStr} 영역)으로 이어진 흐름을 역술가 언어로 구체적으로 풀이할 것.`);
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
  if (tone === 'strategist') return INTERPRET_SYSTEM_STRATEGIST;
  return INTERPRET_SYSTEM_YEOKSULGA;
}
