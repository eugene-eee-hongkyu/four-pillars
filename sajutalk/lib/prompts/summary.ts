// §6-c 정리 응답 프롬프트 (S11)
// 대화 전체를 묶어 정리. 질문 횟수에 비례한 밀도 조절.

import { INTERPRET_SYSTEM } from './interpret';

export const SUMMARY_SYSTEM = `${INTERPRET_SYSTEM}

추가 규칙:
- 지금까지 대화 맥락 전체를 한 번 더 묶어 정리
- 밀도는 질문 횟수 비례:
  * 0회 (이제 됐어요 바로): 3~4문장 짧게
  * 1~2회: 5~7문장 중간 밀도
  * 3회 다 씀: 8~12문장 풍부하게. 누적된 Q&A 답까지 종합
- 자동 전환(3번 다 씀)으로 진입하면 맨 앞 1문장에
  "세 번 물어봐주셨으니, 오늘 얘기 정리해드릴게요" 전환 문구
- 마지막 1문장: 따뜻한 맺음말 ("이번 해석이 도움 되셨길 바라요" 류)
- 금지: "다음에 또 오세요" 류 재방문 유도`;

export interface SummaryContext {
  name: string;
  manse: string;
  concern: string;
  pattern: string;
  history: Array<{ question: string; answer: string }>;
  inlineChoiceAnswer?: string; // 2회차 4지선다 선택 답 (있을 때만)
  isAutoTransition: boolean;   // 3번 다 써서 자동 전환됐는지
}

export function buildSummaryPrompt(ctx: SummaryContext): string {
  const questionCount = ctx.history.length;
  const lines = [
    `사용자 이름: ${ctx.name}`,
    `만세력 원국: ${ctx.manse}`,
    `현재 고민: ${ctx.concern}`,
    `반복 패턴 답: ${ctx.pattern}`,
    `질문 횟수: ${questionCount}회`,
    `전환 방식: ${ctx.isAutoTransition ? '3번 다 씀 (자동 전환)' : '이제 됐어요 (수동 종료)'}`,
  ];

  if (ctx.history.length > 0) {
    lines.push('\nQ&A 기록:');
    for (const turn of ctx.history) {
      lines.push(`Q: ${turn.question}`);
      lines.push(`A: ${turn.answer}`);
    }
  }

  if (ctx.inlineChoiceAnswer) {
    lines.push(`\n2회차 4지선다 선택 답: ${ctx.inlineChoiceAnswer}`);
  }

  return lines.join('\n');
}
