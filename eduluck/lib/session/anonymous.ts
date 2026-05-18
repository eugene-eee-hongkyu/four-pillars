// 비회원 익명 세션 UUID 관리 (sajutalk 패턴 답습)
//
// 클라이언트에서 localStorage에 UUID 저장.
// 서버 요청 시 x-session-id 헤더로 부착.
// Supabase RLS는 이 헤더로 비회원 row 권한 검증 (B-1 v2 §4 RLS).
//
// 회원가입 완료 시 sessions.user_id를 auth.uid()로 update — server-side에서.

const STORAGE_KEY = 'eduluck.session.id';

/**
 * 클라이언트(React Native / web)에서 익명 세션 UUID를 가져오거나 생성.
 * web에서는 localStorage, native에서는 expo-secure-store 사용.
 */
export function getOrCreateAnonymousSessionId(): string {
  // web: localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  }
  // native: expo-secure-store (lazy import — web에서 안 import)
  // Phase 5 화면 구현 시 secure-store wrapper 별도 추가
  throw new Error('native 환경은 Phase 5에서 expo-secure-store wrapper 추가 예정');
}

export function getAnonymousSessionId(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export function clearAnonymousSessionId(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
