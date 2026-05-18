// Supabase 클라이언트 (브라우저/RN 클라이언트 사이드)
// anon key + x-session-id 헤더 전역 설정 → RLS는 이 헤더로 비회원 권한 검증.
//
// 회원 로그인 후에는 Supabase Auth session cookie로 authenticated role 활성.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAnonymousSessionId } from '@/lib/session/anonymous';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase 환경변수 미설정 (NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY). eduluck/.env.local 확인',
    );
  }

  const sessionId = typeof window !== 'undefined' ? getAnonymousSessionId() : null;

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    },
  });
  return _client;
}

/** x-session-id 헤더를 갱신해야 할 때 (회원가입 → 비회원 → 회원 머지 시) 호출 */
export function resetSupabaseClient(): void {
  _client = null;
}
