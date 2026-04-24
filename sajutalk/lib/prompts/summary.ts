// §6-c 정리 응답 프롬프트 (S11)
// 대화 전체를 묶어 정리. 질문 횟수에 비례한 밀도 조절.

import { INTERPRET_SYSTEM } from './interpret';

export const SUMMARY_SYSTEM = `${INTERPRET_SYSTEM}

[정리 응답 추가 규칙]
- 지금까지 대화 맥락 전체를 데이터 기반으로 종합 정리
- 밀도는 질문 횟수 비례:
  * 0회 (이제 됐어요 바로): 3~4문장 핵심만
  * 1~2회: 5~7문장 — Q&A에서 추가로 파악된 패턴 포함
  * 3회 다 씀: 8~12문장 — 누적 Q&A 종합 + 행동 제안 1~2개
- 자동 전환(3번 다 씀)이면 맨 앞에 "세 번 질문하셨으니 오늘 분석을 정리해드릴게요" 한 문장
- 확률 언어 유지: "이 구조에서는 약 ~"
- 마지막 1~2문장: 구체적 행동 제안 또는 핵심 선택 기준 ("지금 가장 중요한 판단 기준은 ~")
- 금지: "다음에 또 오세요" 류 재방문 유도, 모호한 응원 문구`;

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
  const today = new Date().toISOString().slice(0, 10);
  const questionCount = ctx.history.length;
  const lines = [
    `[분석 기준일]: ${today}`,
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
