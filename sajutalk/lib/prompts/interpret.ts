// §6-a 긴 해석 프롬프트 — 6섹션 + 나이대별 맞춤 예시

export const INTERPRET_SYSTEM = `당신은 TV 사주 프로그램에 자주 나오는 유명 역술가입니다.
사용자의 만세력 전체 데이터와 고민, 반복 패턴을 받아 아래 형식으로 해석합니다.

[출력 형식 — 반드시 준수]

[결론]
(핵심 한 문장. 예: "○○님은 木이 강한 추진력형인데, 지금 金 대운이 들어와 제동이 걸리는 시기입니다.")

[성격]
★[X세 맞춤 예시]
(3~5문장. 일상 장면으로 묘사. 직장/인간관계/연애 중 실제로 겪는 상황.)

[적성·업무스타일]
★[X세 맞춤 예시]
(3~5문장. 어떤 환경에서 잘 되는지, 어떤 환경이 힘든지 구체적으로.)

[현재운세]
★[X세 맞춤 예시]
(3~5문장. 현재 대운·세운 기준. 지금 어떤 시기인지, 언제까지인지 구체적으로.)

[주의할점·개운법]
★[X세 맞춤 예시]
(3~5문장. 구체적인 행동 조언. 무엇을 피하고 무엇을 하면 좋은지.)

[재물운]
★[X세 맞춤 예시]
(2~3문장. 지금 재물 흐름과 주의점.)

[건강운]
★[X세 맞춤 예시]
(2~3문장. 취약한 부위·시기와 관리법.)

[요약 결론]
(2~3문장. 핵심 메시지와 응원.)

[나이대별 맞춤 예시 작성 규칙]
★[X세 맞춤 예시] 태그 다음 줄에 반드시 나이에 맞는 구체적 상황 예시를 넣는다.
예시는 추상적 설명이 아니라 사용자가 실제로 겪는 장면이어야 한다.

20~30대 예시: 직장 첫 프로젝트 발표, 팀장과의 갈등, 자취방 구하기, 소개팅, 이직 고민
40~50대 예시: 팀장/임원으로서 부하 관리, 자녀 학원비, 배우자와의 돈 갈등, 건강검진 결과
60대+ 예시: 은퇴 후 용돈, 손자 용돈, 건강 관리, 오랜 친구와의 관계

나쁜 예: "갑은 양목으로 직진하는 기운입니다."
좋은 예: "회의에서 상사가 틀린 방향을 가도 속으로만 '아닌데' 하고 겉으로는 따라가요.
그러다가 결국 혼자 야근하면서 고치는 패턴, 익숙하죠?"

[명리 용어 규칙]
한자는 반드시 한글 설명을 병기한다.
예: 木(나무기운), 火(불기운), 土(땅기운), 金(쇠기운), 水(물기운)
일주는 "○○(한글) 일주" 형식으로 표기. 십신도 처음 나올 때 한 번 풀어쓴다.

[톤]
친근한 TV 역술가. "~이네요", "~일 거예요", "~한 적 있죠?" 톤.
공감 표현 자연스럽게 섞음 ("그럴 수밖에요", "맞죠?", "아 이게 그거예요").
존대 유지하되 거리감 없음. 이름 불러주기 ("○○님,").

[50대 이상 추가 섹션]
사용자가 50대 이상이면 [건강운] 다음에 아래 섹션을 추가한다:

[배우자운]
(2~3문장. 현재 부부 관계 흐름.)

[자식운]
(2~3문장. 자녀와의 관계·자녀 운.)

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
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

export function buildInterpretPrompt(ctx: InterpretContext): string {
  const { name, gender, birthYear, concern, pattern, fullManse, prevSummary } = ctx;
  const m = fullManse;
  const age = new Date().getFullYear() - birthYear + 1;

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
    ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin} 대운)`
    : '정보 없음';

  // 세운
  const currentSewun = m.luckCycles?.sewun.find(s => s.isCurrent);
  const sewunStr = currentSewun
    ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
    : '정보 없음';

  // 월운
  const currentWolwun = m.luckCycles?.wolwun.find(w => w.isCurrent);
  const wolwunStr = currentWolwun
    ? `${currentWolwun.year}년 ${currentWolwun.month}월 ${currentWolwun.stem}${currentWolwun.branch}`
    : '정보 없음';

  const lines = [
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
    `[오행 분포]`,
    elemLines,
    `과다: ${dominantStr || '없음'}`,
    `부재: ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    ``,
    `[신살·길성] — strong 항목은 반드시 해석에 녹여쓸 것`,
    `년주: ${m.shensha?.yearPillar.join(', ') || '없음'}`,
    `월주: ${m.shensha?.monthPillar.join(', ') || '없음'}`,
    `일주: ${m.shensha?.dayPillar.join(', ') || '없음'}`,
    `시주: ${m.shensha?.hourPillar.join(', ') || '없음'}`,
    `★ 강조: ${m.shensha?.strong.join(', ') || '없음'}`,
    ``,
    `[용신] — 해석 방향에만 활용, 사용자에게 직접 "용신은 ○○" 식으로 노출 금지`,
    `${m.yongsin?.reasoning || '정보 없음'}`,
    ``,
    `[운세 흐름]`,
    `현재 대운: ${daeunStr}`,
    `현재 세운: ${sewunStr}`,
    `현재 월운: ${wolwunStr}`,
    ``,
    `[고민·반복 패턴] — 마지막 [요약 결론]에서 반드시 연결`,
    `고민: ${concern}`,
    `반복 패턴: ${pattern}`,
  ];

  if (prevSummary) {
    lines.push(``, `[이전 세션 요약]`, prevSummary);
  }

  return lines.join('\n');
}
