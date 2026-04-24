// §6-b Q&A 답변 프롬프트 (S9)
// 긴 해석 이후 사용자 질문에 답변. 2회차+2번째 질문이면 답변 말미에 4지선다 삽입.

import { INTERPRET_SYSTEM, getInterpretSystem, FullManseData, type ToneType } from './interpret';

const QNA_SUFFIX = `

[Q&A 추가 규칙]
- 사용자 질문에 직접 답변. 원 해석과 모순 없이 일관성 유지
- 4기둥 원국 + 합충형파해 + 신살·길성 + 대운·세운 + 반복 패턴 + 이전 대화 전체 맥락 활용
- 5~8문장. 질문 성격에 따라 조금 더 길어도 됨
- 현재 대운·세운 데이터 있으면 반드시 활용: "지금 ○○ 대운 데이터상 이 시기에는..."
- 합충 정보 있으면 활용: "월일이 충하는 구조라서 이 패턴이 나타나는 거예요"
- 사용자가 과거 사건을 공유하면 해당 연도 세운과 연결해 역검증 먼저 제시
- 확률 언어 필수: "이런 구조에서 약 7할은..." "데이터상..."
- Sycophancy 금지: 원국 근거 있으면 사용자가 원하지 않는 답도 말함

- 2회차 세션 + 이번이 2번째 질문 + 50% 조건이면 답변 말미에
  "혹시 이런 경험 있으세요?" 4지선다 4개 삽입. 답변 본문과 구분선.`;

export const QNA_SYSTEM = `${INTERPRET_SYSTEM}${QNA_SUFFIX}`;

export function getQnaSystem(tone?: ToneType): string {
  return `${getInterpretSystem(tone)}${QNA_SUFFIX}`;
}

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

function buildManseSection(m: FullManseData): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push(`[분석 기준일]: ${today}`);
  lines.push(``);
  lines.push(`[사주 4기둥]`);
  lines.push(`년주: ${m.yearPillar}(${m.yearPillarHanja})`);
  lines.push(`월주: ${m.monthPillar}(${m.monthPillarHanja})`);
  lines.push(`일주: ${m.dayPillar}(${m.dayPillarHanja})  ← 핵심 일주`);
  lines.push(`시주: ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`);
  lines.push(``);

  if (m.jijanggan) {
    lines.push(`[지장간]`);
    lines.push(`년주: ${m.jijanggan.yearPillar.join(', ') || '—'}`);
    lines.push(`월주: ${m.jijanggan.monthPillar.join(', ') || '—'}`);
    lines.push(`일주: ${m.jijanggan.dayPillar.join(', ') || '—'}`);
    lines.push(`시주: ${m.jijanggan.hourPillar?.join(', ') || '—'}`);
    lines.push(``);
  }

  if (m.elementCounts) {
    const total = Object.values(m.elementCounts).reduce((s, v) => s + v, 0);
    const elemLines = (Object.entries(m.elementCounts) as [string, number][])
      .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}개 (${total > 0 ? Math.round(cnt / total * 100) : 0}%)`)
      .join(', ');
    lines.push(`[오행 분포]`);
    lines.push(elemLines);
    lines.push(``);
  }

  if (m.hapchunh) {
    lines.push(`[합충형파해]`);
    lines.push(m.hapchunh.summary || '없음');
    lines.push(``);
  }

  if (m.shensha) {
    lines.push(`[신살·길성] — strong 항목 답변에 활용`);
    lines.push(`★ 강조: ${m.shensha.strong.join(', ') || '없음'}`);
    lines.push(``);
  }

  if (m.yongsin) {
    lines.push(`[용신] — 해석 방향에만 활용, 사용자에게 직접 노출 금지`);
    lines.push(m.yongsin.reasoning);
    lines.push(``);
  }

  if (m.luckCycles) {
    const currentDaeun = m.luckCycles.daeun.find(d => d.isCurrent);
    const daeunStr = currentDaeun
      ? `${currentDaeun.age}세 시작 ${currentDaeun.stem}${currentDaeun.branch}(${currentDaeun.stemSipsin}·${currentDaeun.branchSipsin} 대운)`
      : '정보 없음';

    const currentSewun = m.luckCycles.sewun.find(s => s.isCurrent);
    const sewunStr = currentSewun
      ? `${currentSewun.year}년 ${currentSewun.stem}${currentSewun.branch}(${currentSewun.stemSipsin})`
      : '정보 없음';

    const currentWolwun = m.luckCycles.wolwun.find(w => w.isCurrent);
    const wolwunStr = currentWolwun
      ? `${currentWolwun.year}년 ${currentWolwun.month}월 ${currentWolwun.stem}${currentWolwun.branch}`
      : '정보 없음';

    lines.push(`[운세 흐름] — 반드시 현재 대운·세운 언급, 확률 언어 사용`);
    lines.push(`현재 대운: ${daeunStr}`);
    lines.push(`현재 세운: ${sewunStr}`);
    lines.push(`현재 월운: ${wolwunStr}`);
    lines.push(``);
  }

  return lines;
}

export interface QnaContext {
  name: string;
  manse: string; // 레거시 텍스트 요약 (fullManse 없을 때 폴백)
  concern: string;
  pattern: string;
  history: Array<{ question: string; answer: string }>;
  question: string;
  inlineChoices?: string[];
  fullManse?: FullManseData;
  tone?: ToneType;
}

export function buildQnaPrompt(ctx: QnaContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [`사용자 이름: ${ctx.name}`, ``];

  if (ctx.fullManse && ctx.fullManse.dayPillar) {
    lines.push(...buildManseSection(ctx.fullManse));
  } else {
    lines.push(`[분석 기준일]: ${today}`);
    lines.push(`만세력 원국: ${ctx.manse}`);
    lines.push(``);
  }

  lines.push(`[고민·반복 패턴]`);
  lines.push(`고민: ${ctx.concern}`);
  lines.push(`반복 패턴 답: ${ctx.pattern}`);

  if (ctx.history.length > 0) {
    lines.push('\n이전 대화:');
    for (const turn of ctx.history) {
      lines.push(`Q: ${turn.question}`);
      lines.push(`A: ${turn.answer}`);
    }
  }

  lines.push(`\n현재 질문: ${ctx.question}`);

  if (ctx.inlineChoices) {
    lines.push(
      '\n답변 말미에 아래 구분선과 함께 4지선다를 추가하세요:',
      '---',
      '혹시 이런 경험 있으세요?',
      ...ctx.inlineChoices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`),
    );
  }

  return lines.join('\n');
}
