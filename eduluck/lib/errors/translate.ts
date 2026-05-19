// 에러 메시지 한글 번역 — 학부모 친화 톤
// API·Supabase·LLM 영문 에러를 한글로 매핑. 매칭 안 되면 fallback.

const EXACT: Record<string, string> = {
  'email rate limit exceeded': '메일 발송 제한에 걸렸어요. 잠시 후 다시 시도해주세요.',
  'invalid login credentials': '이메일 또는 비밀번호가 일치하지 않아요.',
  'user already registered': '이미 가입된 이메일이에요. 비밀번호로 로그인해주세요.',
  'invalid email': '이메일 형식을 확인해주세요.',
  'password should be at least 6 characters': '비밀번호는 6자 이상이어야 해요.',
  'session expired': '세션이 만료됐어요. 처음부터 다시 시작해주세요.',
  'missing required fields': '필요한 정보가 빠져 있어요. 다시 확인해주세요.',
  'failed to fetch': '인터넷 연결을 확인해주세요.',
  'network error': '인터넷 연결을 확인해주세요.',
  'unknown error': '알 수 없는 오류가 발생했어요. 다시 시도해주세요.',
};

const PATTERN: Array<[RegExp, string]> = [
  [/rate ?limit/i, '잠시 후 다시 시도해주세요 (요청이 너무 많아요).'],
  [/invalid.+(token|otp|code)/i, '인증 코드가 올바르지 않거나 만료됐어요.'],
  [/not ?found/i, '해당 정보를 찾을 수 없어요.'],
  [/timeout|timed out/i, '응답이 너무 오래 걸렸어요. 다시 시도해주세요.'],
  [/duplicate|already exists/i, '이미 있는 데이터예요.'],
  [/permission|forbidden|unauthorized/i, '권한이 없어요.'],
  [/manse|만세력/i, '만세력 계산 중 오류가 발생했어요.'],
];

/** API·SDK 영문 에러를 한글로 번역. 매칭 안 되면 원문 + fallback 안내. */
export function translateError(raw: string | undefined | null): string {
  if (!raw) return '알 수 없는 오류가 발생했어요. 다시 시도해주세요.';
  const lower = raw.toLowerCase().trim();
  if (EXACT[lower]) return EXACT[lower];
  for (const [re, msg] of PATTERN) {
    if (re.test(raw)) return msg;
  }
  // fallback: 원문 + 안내 (사용자에게 raw 노출은 정보 제공 + dev 디버그용)
  return `잠시 후 다시 시도해주세요. (${raw.slice(0, 80)})`;
}
