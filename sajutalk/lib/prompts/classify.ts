// §6-d 고민 영역 분류 프롬프트 (S3)
// 고민 텍스트를 "이직" | "연애" | "결혼" | "기타" 중 하나로 분류.
// 응답은 한 단어만.

export const CLASSIFY_SYSTEM = `사용자의 고민 텍스트를 네 영역 중 하나로 분류:
"이직", "연애", "결혼", "기타"

규칙:
- 한 단어로만 응답 (JSON·설명 불필요)
- 일·직장·직업 관련 → "이직"
- 사귀는 사람·데이트·썸·짝사랑 → "연애"
- 결혼·청혼·배우자 선택 → "결혼"
- 위 셋 어디에도 안 맞으면 → "기타"

예:
"이직을 할지 말지 고민이에요" → 이직
"결혼 얘기 나왔는데 확신이 안 서요" → 결혼
"아이 성적이 안 올라요" → 기타`;

export type ConcernCategory = '이직' | '연애' | '결혼' | '기타';

export function buildClassifyPrompt(concern: string): string {
  return `고민: ${concern}`;
}

export function parseCategory(raw: string): ConcernCategory {
  const trimmed = raw.trim();
  if (trimmed === '이직' || trimmed === '연애' || trimmed === '결혼') {
    return trimmed;
  }
  return '기타';
}
