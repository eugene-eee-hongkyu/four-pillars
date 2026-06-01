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
  /**
   * 카카오 로그인.
   * @param redirectPath callback 후 이동 경로
   * @param requireEmail true 시 account_email scope 추가 — admin 로그인용 (일반 사용자 default false)
   */
  login: (redirectPath?: string, requireEmail?: boolean) => Promise<void>;
  /** Google 로그인 (admin) */
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

  const login = useCallback(async (redirectPath?: string, requireEmail = true) => {
    setError(null);
    if (typeof window === 'undefined') return;
    // redirectPath 지정 시 sessionStorage에 박아서 callback에서 분기 (Google OAuth와 동일 패턴)
    if (redirectPath) {
      try {
        sessionStorage.setItem('eduluck.admin.nextPath', redirectPath);
      } catch {
        // silent
      }
    }
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    // Supabase Kakao provider default scope = "account_email profile_image profile_nickname".
    // 일반 앱은 account_email 비즈 검수 필요 → KOE205. options.scopes 는 append 만 됨.
    //
    // 우회: skipBrowserRedirect 로 OAuth URL 만 받아온 뒤 scope 파라미터를 직접 교체.
    // 2026-06-01 변경: 일반 사용자도 default로 account_email 받음 (mom test 사용자 명시 정책).
    // - default (일반 사용자·admin): profile_nickname + account_email
    // - requireEmail=false 명시: profile_nickname 만 (이메일 부담 회피 케이스용)
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
      const scope = requireEmail ? 'profile_nickname account_email' : 'profile_nickname';
      url.searchParams.set('scope', scope);
      window.location.href = url.toString();
    }
  }, []);

  const loginWithGoogle = useCallback(async (redirectPath: string = '/admin') => {
    setError(null);
    if (typeof window === 'undefined') return;
    // Supabase가 callback URL을 history.replaceState로 cleanup하면서 query string을 같이 지울 수 있음.
    // 안전하게 sessionStorage로 전달 — OAuth는 같은 탭에서 redirect되므로 유지됨.
    try {
      sessionStorage.setItem('eduluck.admin.nextPath', redirectPath);
    } catch {
      // sessionStorage 사용 불가 (privacy mode 등) — query fallback에 의존
    }
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
