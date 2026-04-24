// §6-a 긴 해석 프롬프트 (S6)
// 훅 4개(일주·오행·대운·신살) + 각 5~8문장 쉬운 풀이 + 예시 = 40문장+

export const INTERPRET_SYSTEM = `당신은 TV 사주 프로그램에 자주 나오는 유명 역술가입니다.
사용자의 만세력 전체 데이터와 고민, 반복 패턴을 받아 40문장 이상의 긴 해석을 씁니다.

[분량 — 엄수]
반드시 아래 5개 구획을 모두 채워 총 40문장 이상 작성한다.

  구획 1. 일주 훅 (1문장) + 쉬운 풀이 5~8문장
  구획 2. 오행 핵심 훅 (1문장) + 쉬운 풀이 5~8문장
  구획 3. 현재 대운 훅 (1문장) + 쉬운 풀이 5~8문장
  구획 4. 신살 훅 (1문장, strong 신살 1~2개) + 쉬운 풀이 5~8문장
  구획 5. 고민·반복 패턴 연결 (4~5문장, 원국과 이어서)

[쉬운 풀이 작성 규칙 — 핵심]
각 구획의 쉬운 풀이는 일상 상황 예시를 2~3개 반드시 포함.
명리 개념을 추상적으로 설명하지 말고, 사용자가 실제로 겪는 장면을 그려준다.

나쁜 예: "갑은 양목으로 직진하는 기운입니다."
좋은 예: "회사에서 상사가 '이렇게 하자'고 했을 때 속으로 '근데 저건 아닌데'가 올라오는 타입.
          친구 관계에서도 누가 억지 부리면 티는 안 내도 거리를 두기 시작해요.
          연애에서도 상대가 논리적으로 틀렸다 싶으면 감정이 확 식어버려요."

[톤 — 기존과 동일]
친근한 TV 역술가. "~이네요", "~일 거예요", "~한 적 있죠?" 톤.
공감 표현 자연스럽게 섞음 ("그럴 수밖에요", "맞죠?", "아 이게 그거예요").
존대 유지하되 거리감 없음. 이름 불러주기 ("○○님,").

[해석 출력 규칙]
사용자에게 직접 언급할 것: 일주, 오행 과다·부족, 현재 대운, strong 신살 1~2개
내부 근거로만 쓸 것 (직접 열거 금지): 십신 분포, 용신, 세부 신살, 월주·년주·시주
→ 내부 근거는 '왜 그런 성격이 나오는지' 이유로 녹여쓴다.

[이전 세션 DB가 있을 때]
자연스럽게 기억하는 말투로 참조:
"아 지난번에 ○○ 고민 얘기하셨었죠. 그때 말씀드린 거랑 연결해서 보면..."`;

export interface FullManseData {
  // 사주 4기둥
  yearPillar: string;
  yearPillarHanja: string;
  monthPillar: string;
  monthPillarHanja: string;
  dayPillar: string;
  dayPillarHanja: string;
  hourPillar: string | null;
  hourPillarHanja: string | null;
  // 오행
  elementCounts: { wood: number; fire: number; earth: number; metal: number; water: number };
  // 신살
  shensha?: {
    yearPillar: string[];
    monthPillar: string[];
    dayPillar: string[];
    hourPillar: string[];
    strong: string[];
  };
  // 용신
  yongsin?: { primary: string; secondary: string | null; reasoning: string };
  // 대운·세운·월운
  luckCycles?: {
    daeun: Array<{ age: number; stem: string; branch: string; stemSipsin: string; branchSipsin: string; isCurrent: boolean }>;
    sewun: Array<{ year: number; stem: string; branch: string; stemSipsin: string; isCurrent: boolean }>;
    wolwun: Array<{ month: number; year: number; stem: string; branch: string; isCurrent: boolean }>;
  };
  // 요약 (기존 호환)
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
}

const ELEMENT_KO: Record<string, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

export function buildInterpretPrompt(ctx: InterpretContext): string {
  const { name, gender, birthYear, concern, pattern, fullManse, prevSummary } = ctx;
  const m = fullManse;

  // 오행 비중 계산
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

  // 현재 대운
  const currentDaeun = m.luckCycles?.daeun.find(d => d.isCurrent);
  const daeunStr = currentDaeun
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin} 대운)`
    : '정보 없음';

  // 세운
  const currentSewun = m.luckCycles?.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  // 십신 분포 (내부 근거용)
  // 월운
  const currentWolwun = m.luckCycles?.wolwun.find(w => w.isCurrent);
  const wolwunStr = currentWolwun
    ? `${currentWolwun.year}년 ${currentWolwun.month}월 ${currentWolwun.stem}${currentWolwun.branch}`
    : '정보 없음';

  const lines = [
    `[사용자 정보]`,
    `이름: ${name}`,
    `성별: ${gender === 'female' ? '여성' : '남성'}`,
    `출생년도: ${birthYear}년`,
    ``,
    `[사주 4기둥]`,
    `년주: ${m.yearPillar}(${m.yearPillarHanja})`,
    `월주: ${m.monthPillar}(${m.monthPillarHanja})`,
    `일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주, 구획 1에서 반드시 언급`,
    `시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    ``,
    `[오행 분포] — 구획 2에서 과다·부족 중심으로 언급`,
    elemLines,
    `과다: ${dominantStr || '없음'}`,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[신살] — 구획 4에서 strong 신살 언급, 나머지는 내부 근거`,
    `년주: ${m.shensha?.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha?.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha?.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha?.hourPillar.join(', ') || '없음'}`,
    `★ 강조 신살: ${m.shensha?.strong.join(', ') || '없음'}  ← 구획 4 훅으로 사용`,
    ``,
    `[용신] — 내부 근거, 사용자에게 직접 노출 금지`,
    `${m.yongsin?.reasoning || '정보 없음'}`,
    ``,
    `[운세 흐름] — 구획 3에서 현재 대운 언급`,
    `현재 대운: ${daeunStr}  ← 구획 3 훅으로 사용`,
    `현재 세운: ${sewunStr}`,
    `현재 월운: ${wolwunStr}`,
    ``,
    `[고민·반복 패턴] — 구획 5에서 원국과 연결`,
    `고민: ${concern}`,
    `반복 패턴: ${pattern}`,
  ];

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}
