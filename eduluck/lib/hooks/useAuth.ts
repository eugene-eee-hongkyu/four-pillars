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
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
  /** OAuth provider identifier (`kakao` / `google` / ...). admin 분기용 */
  provider: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  /** 카카오 로그인 (일반 사용자) */
  login: () => Promise<void>;
  /** Google 로그인 (admin 전용) */
  loginWithGoogle: (redirectPath?: string) => Promise<void>;
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
  // identities[0].provider 로 OAuth provider 식별 (kakao / google)
  const provider = (u.app_metadata?.provider as string | undefined) ?? null;
  return { id: u.id, email: u.email ?? null, nickname, avatarUrl, provider };
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
    if (typeof window === 'undefined') return;
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    // Supabase Kakao provider default scope = "account_email profile_image profile_nickname".
    // 일반 앱은 account_email 비즈 검수 필요 → KOE205. options.scopes 는 append 만 됨.
    //
    // 우회: skipBrowserRedirect 로 OAuth URL 만 받아온 뒤 scope 파라미터를 직접 교체.
    // Supabase 의 state·redirect_uri 는 그대로 유지되어 콜백 검증 통과.
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (err) {
      setError(err);
      return;
    }
    if (data?.url) {
      const url = new URL(data.url);
      url.searchParams.set('scope', 'profile_nickname');
      window.location.href = url.toString();
    }
  }, []);

  const loginWithGoogle = useCallback(async (redirectPath: string = '/admin') => {
    setError(null);
    if (typeof window === 'undefined') return;
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          // refresh_token 받으려면 access_type=offline + prompt=consent 필요. admin 세션 갱신용.
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (err) setError(err);
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error: err } = await supabase.auth.signOut();
    if (err) setError(err);
  }, []);

  return { user, loading, error, login, loginWithGoogle, logout };
}
