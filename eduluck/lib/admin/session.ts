// admin 세션 토큰 (client-side) — 유저 OAuth 와 완전 분리.
// 토큰은 localStorage 에 보관하고 adminFetch 가 Authorization: Bearer 로 첨부.

import { useCallback } from 'react';
import { useRouter } from 'expo-router';

const TOKEN_KEY = 'eduluck.admin.token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // silent
  }
}

function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // silent
  }
}

export interface AdminLoginResult {
  ok: boolean;
  error?: string;
  role?: 'admin' | 'super_admin';
}

/** id/pw 로그인 → 성공 시 토큰 저장. */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResult> {
  let res: Response;
  try {
    res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return { ok: false, error: '네트워크 오류. 잠시 후 다시 시도하세요.' };
  }
  const json = (await res.json().catch(() => ({}))) as {
    token?: string;
    role?: 'admin' | 'super_admin';
    error?: string;
  };
  if (!res.ok || !json.token) {
    return { ok: false, error: json.error ?? '로그인에 실패했습니다.' };
  }
  setAdminToken(json.token);
  return { ok: true, role: json.role };
}

/** 로그아웃 — 로컬 토큰 폐기 + 서버 세션 삭제(best-effort). */
export async function adminLogout(): Promise<void> {
  const token = getAdminToken();
  clearAdminToken();
  if (token) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // silent — 이미 로컬 토큰은 폐기됨
    }
  }
}

/** admin 페이지 공용 로그아웃 핸들러 — 로그아웃 후 /admin(로그인)으로 이동. */
export function useAdminLogout(): () => Promise<void> {
  const router = useRouter();
  return useCallback(async () => {
    await adminLogout();
    router.replace('/admin' as never);
  }, [router]);
}
