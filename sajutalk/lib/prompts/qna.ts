// §6-b Q&A 답변 프롬프트 (S9)
// 긴 해석 이후 사용자 질문에 답변. 2회차+2번째 질문이면 답변 말미에 4지선다 삽입.

import { INTERPRET_SYSTEM } from './interpret';

export const QNA_SYSTEM = `${INTERPRET_SYSTEM}

추가 규칙:
- 사용자 질문에 직접 답변. 원 해석과 모순 없이 일관성 유지
- 만세력 원국 + 반복 패턴 답 + 이전 대화 전체 맥락을 재료로 사용
- 5~7문장. 질문 성격에 따라 조금 더 길어도 됨
- Sycophancy 금지: 사용자가 원하는 답 아니어도 원국 근거 있으면 그대로 말함
  예: "이직이 맞냐" → "지금 이직은 원국상 ~라는 이유로 무리예요"도 OK

- 2회차 세션 + 이번이 2번째 질문 + 50% 조건이면 답변 말미에
  "혹시 이런 경험 있으세요?" 4지선다 4개 삽입. 답변 본문과 구분선.`;

export interface QnaContext {
  name: string;
  manse: string;
  concern: string;
  pattern: string;
  history: Array<{ question: string; answer: string }>;
  question: string;
  inlineChoices?: string[]; // 4지선다 삽입 시 선택지 텍스트 4개
}

export function buildQnaPrompt(ctx: QnaContext): string {
  const lines = [
    `사용자 이름: ${ctx.name}`,
    `만세력 원국: ${ctx.manse}`,
    `현재 고민: ${ctx.concern}`,
    `반복 패턴 답: ${ctx.pattern}`,
  ];

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
