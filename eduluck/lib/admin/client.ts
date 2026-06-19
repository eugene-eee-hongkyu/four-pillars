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

// 세션 단위 신원 캐시 — 같은 access_token이면 /api/admin/me 재호출 생략.
// 탭 이동마다 왕복(getUser 네트워크 + admin_users 조회)하던 비용 제거.
// 보안 영향 없음: 실제 권한 검증은 모든 /api/admin/* 데이터 API가 매 요청 서버에서 독립 수행.
// 토큰이 바뀌면(재로그인) 키 불일치로 자동 무효화, 로그아웃 시 clearAdminMeCache로 명시 무효화.
let _meCache: { token: string; me: AdminMe } | null = null;

export function clearAdminMeCache(): void {
  _meCache = null;
}

async function currentAccessToken(): Promise<string | null> {
  // getSession은 로컬 저장소 읽기(네트워크 ✗) — 캐시 키 비교용으로 저렴.
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchAdminMe(): Promise<AdminMeResult> {
  const token = await currentAccessToken();
  if (token && _meCache && _meCache.token === token) {
    return _meCache.me;
  }

  const res = await adminFetch('/api/admin/me');
  if (res.status === 401) {
    // 토큰 부재·만료. 재로그인 안내.
    return { isAdmin: false, error: 'session expired or missing token', debug: null };
  }
  const json = await res.json();
  if (res.ok) {
    const me = json as AdminMe;
    if (token) _meCache = { token, me };
    return me;
  }
  // 403 등 — 디버그 정보 포함 반환 (UI에서 안내). 캐시하지 않음.
  return { isAdmin: false, error: json.error ?? 'unknown', debug: json.debug ?? null };
}
