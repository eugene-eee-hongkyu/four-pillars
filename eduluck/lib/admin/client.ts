// admin 페이지 fetch helper — admin 세션 토큰을 Authorization 헤더에 자동 첨부.
// ⚠️ 유저 OAuth(Supabase auth) 와 무관. 토큰은 lib/admin/session 이 관리.

import { getAdminToken } from './session';

function getAuthHeader(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init.headers ?? {}),
    },
  });
}

export interface AdminMe {
  isAdmin: true;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface AdminMeError {
  isAdmin: false;
  error: string;
}

export type AdminMeResult = AdminMe | AdminMeError;

// 세션 단위 신원 캐시 — 같은 토큰이면 /api/admin/me 재호출 생략.
// 보안 영향 없음: 실제 권한 검증은 모든 /api/admin/* 데이터 API가 매 요청 서버에서 독립 수행.
// 토큰이 바뀌면(재로그인·로그아웃) 키 불일치로 자동 무효화.
let _meCache: { token: string; me: AdminMe } | null = null;

export function clearAdminMeCache(): void {
  _meCache = null;
}

export async function fetchAdminMe(): Promise<AdminMeResult> {
  const token = getAdminToken();
  if (!token) {
    return { isAdmin: false, error: 'no admin token' };
  }
  if (_meCache && _meCache.token === token) {
    return _meCache.me;
  }

  let res: Response;
  try {
    res = await adminFetch('/api/admin/me');
  } catch {
    return { isAdmin: false, error: '네트워크 오류' };
  }
  if (res.status === 401) {
    return { isAdmin: false, error: 'session expired or missing token' };
  }
  const json = await res.json().catch(() => ({}));
  if (res.ok && json.isAdmin) {
    const me = json as AdminMe;
    _meCache = { token, me };
    return me;
  }
  return { isAdmin: false, error: json.error ?? 'unknown' };
}
