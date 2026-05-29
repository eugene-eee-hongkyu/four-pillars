// Supabase Auth 기반 카카오 로그인 hook.
//
// 모델: supabase.auth.signInWithOAuth({provider:'kakao'}) → 카카오 인증 →
// Supabase 가 auth.users 자동 생성 + JWT 발급 + redirect.
// onAuthStateChange 구독으로 user 상태 실시간 동기화.

import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

function toAuthUser(u: User | null): AuthUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const nickname =
    (meta.nickname as string | undefined) ??
    (meta.name as string | undefined) ??
    (meta.preferred_username as string | undefined) ??
    '회원';
  const avatarUrl =
    (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null;
  return { id: u.id, nickname, avatarUrl };
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(toAuthUser(data.session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    setError(null);
    const supabase = getSupabaseClient();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (err) setError(err);
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error: err } = await supabase.auth.signOut();
    if (err) setError(err);
  }, []);

  return { user, loading, error, login, logout };
}
