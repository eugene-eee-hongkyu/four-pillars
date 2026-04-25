// localStorage 기반 세션 데이터 관리
// 화면 간 상태를 전달하는 유일한 경로.

export type ToneType = 'daily' | 'premium';

export interface LocalProfile {
  anonId: string;
  name: string;
  gender: 'male' | 'female';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  timeUnknown: boolean;
  manse?: Record<string, unknown>;
  sessionCount: number;
}

export interface LocalConversation {
  concern: string;
  concernText?: string;
  concernCategory?: string;
  pattern: string;
  tone?: ToneType;
}

const PROFILE_KEY = 'sajutalk_profile';
const CONVERSATION_KEY = 'sajutalk_conversation';

export function saveProfile(p: LocalProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadProfile(): LocalProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalProfile; } catch { return null; }
}

export function saveConversation(c: LocalConversation) {
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(c));
}

export function loadConversation(): LocalConversation | null {
  const raw = localStorage.getItem(CONVERSATION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalConversation; } catch { return null; }
}
