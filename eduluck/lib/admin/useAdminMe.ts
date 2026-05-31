// admin 페이지 인증 가드 hook.
// useAuth + /api/admin/me 두 단계로 검증:
//   1. Supabase 세션 (Google OAuth user) 존재 확인
//   2. /api/admin/me로 admin_users 권한 확인
// admin 아니면 redirectIfNot 호출.

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchAdminMe, type AdminMe } from './client';

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
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // 로그인 안 됨 → /admin (로그인 페이지)
      router.replace('/admin' as never);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchAdminMe().then((res) => {
      if (cancelled) return;
      if (!res?.isAdmin) {
        // admin 아님 → /admin로 (로그아웃 후 안내)
        router.replace('/admin' as never);
        setError('admin 권한이 없습니다');
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
  }, [user, authLoading, requireSuperAdmin, router]);

  return { me, loading, error };
}
