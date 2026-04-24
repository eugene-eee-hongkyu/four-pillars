// 익명 세션 ID 관리 — localStorage 기반 UUID
// 서버 컴포넌트에서는 쿠키 기반으로 전달.

const KEY = 'sajutalk_anon_id';

export function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateAnonId must be called client-side');
  }
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}

export function getAnonId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}
