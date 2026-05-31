// admin 페이지에서 사용하는 fetch helper.
// Supabase JWT를 자동으로 Authorization 헤더에 첨부.

import { getSupabaseClient } from '@/lib/supabase/client';

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const authHeader = await getAuthHeader();
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(init.headers ?? {}),
    },
  });
}

export interface AdminMe {
  isAdmin: boolean;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface AdminMeError {
  isAdmin: false;
  error: string;
  debug?: {
    userEmail?: string;
    provider?: string;
    hasSuperAdminEmailEnv?: boolean;
    superAdminEmailMatches?: boolean;
    adminUsersRowExists?: boolean;
  } | null;
}

export type AdminMeResult = AdminMe | AdminMeError;

export async function fetchAdminMe(): Promise<AdminMeResult> {
  const res = await adminFetch('/api/admin/me');
  if (res.status === 401) {
    // 토큰 부재·만료. 재로그인 안내.
    return { isAdmin: false, error: 'session expired or missing token', debug: null };
  }
  const json = await res.json();
  if (res.ok) return json as AdminMe;
  // 403 등 — 디버그 정보 포함 반환 (UI에서 안내)
  return { isAdmin: false, error: json.error ?? 'unknown', debug: json.debug ?? null };
}
