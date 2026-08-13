// admin 페이지 인증 가드 hook — admin 세션 토큰 기반 (유저 OAuth 와 무관).

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { fetchAdminMe, type AdminMe } from './client';
import { getAdminToken } from './session';

export interface UseAdminMeReturn {
  me: AdminMe | null;
  loading: boolean;
  error: string | null;
}

/**
 * @param requireSuperAdmin true → super_admin이 아니면 /admin/subjects로 리다이렉트
 */
export function useAdminMe(requireSuperAdmin = false): UseAdminMeReturn {
  const router = useRouter();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰 없음 → 로그인 페이지
    if (!getAdminToken()) {
      router.replace('/admin' as never);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchAdminMe().then((res) => {
      if (cancelled) return;
      if (!res.isAdmin) {
        // 토큰 만료·무효 → /admin 재로그인
        router.replace('/admin' as never);
        setError(res.error);
        setLoading(false);
        return;
      }
      if (requireSuperAdmin && res.role !== 'super_admin') {
        router.replace('/admin/subjects' as never);
        setError('super-admin 권한이 필요합니다');
        setLoading(false);
        return;
      }
      setMe(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [requireSuperAdmin, router]);

  return { me, loading, error };
}
