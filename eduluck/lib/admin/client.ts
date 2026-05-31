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

export async function fetchAdminMe(): Promise<AdminMe | null> {
  const res = await adminFetch('/api/admin/me');
  if (!res.ok) return null;
  return (await res.json()) as AdminMe;
}
