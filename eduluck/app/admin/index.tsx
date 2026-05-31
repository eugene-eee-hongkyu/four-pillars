// /admin — admin 로그인 페이지.
// Google OAuth 버튼 + 로그인 후 자동 /admin/subjects 리다이렉트.
// admin 권한 없으면 디버그 정보 노출 (환경변수·이메일 일치 여부).

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchAdminMe, type AdminMeResult } from '@/lib/admin/client';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { KakaoLoginButton } from '@/components/KakaoLoginButton';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [meResult, setMeResult] = useState<AdminMeResult | null>(null);
  const [checking, setChecking] = useState(false);

  // 이미 로그인된 상태 — admin 여부 확인 → admin이면 /admin/subjects
  useEffect(() => {
    if (authLoading || !user) {
      setMeResult(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    fetchAdminMe().then((res) => {
      if (cancelled) return;
      setChecking(false);
      setMeResult(res);
      if (res.isAdmin) {
        router.replace('/admin/subjects' as never);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  // 1. 인증 로딩 중
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2. 로그인 안 됨 — Google 로그인 버튼
  if (!user) {
    return (
      <View className="flex-1 bg-surface">
        <ScrollView contentContainerClassName="flex-1 items-center justify-center px-container-padding gap-6">
          <View className="items-center gap-3 max-w-md w-full">
            <Text className="font-heading-bold text-display-md text-text-pri text-center">
              eduluck admin
            </Text>
            <Text className="font-body text-body-md text-text-sub text-center leading-relaxed">
              진단 데이터 검수·관리 콘솔
            </Text>
          </View>

          <View className="w-full max-w-md mt-6 gap-3">
            <GoogleLoginButton redirectPath="/admin/subjects" />
            <KakaoLoginButton source="landing" size="lg" redirectPath="/admin/subjects" />
          </View>

          <Text className="font-body text-label-sm text-text-sub text-center max-w-md leading-relaxed mt-4">
            ⚠️ 등록된 어드민 계정(admin_users)만 접근 가능합니다.{'\n'}
            Google·카카오 어떤 OAuth로 로그인해도 등록된 이메일이면 통과.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // 3. 로그인 됨 + admin 확인 중
  if (checking || !meResult) {
    return (
      <View className="flex-1 items-center justify-center bg-surface gap-3">
        <ActivityIndicator size="large" />
        <Text className="font-body text-body-md text-text-sub">권한 확인 중...</Text>
      </View>
    );
  }

  // 4. 로그인 됨 + admin → useEffect에서 redirect (이 화면 잠시만)
  if (meResult.isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-surface gap-3">
        <ActivityIndicator size="large" />
        <Text className="font-body text-body-md text-text-sub">/admin/subjects로 이동 중...</Text>
      </View>
    );
  }

  // 5. 로그인 됨 + admin 아님 — 진단 정보 노출
  const debug = 'debug' in meResult ? meResult.debug : null;
  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-container-padding gap-6">
        <View className="items-center gap-3 max-w-md w-full">
          <Text className="text-display-md">⛔</Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri text-center">
            admin 권한 없음
          </Text>
        </View>

        <View className="w-full max-w-md p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2">
          <Text className="font-body-bold text-body-md text-text-pri">진단 정보</Text>
          <DiagRow label="로그인 이메일" value={user.email ?? '(없음)'} />
          <DiagRow label="로그인 방식" value={user.provider ?? '(없음)'} />
          {debug && (
            <>
              <DiagRow
                label="SUPER_ADMIN_EMAIL env"
                value={debug.hasSuperAdminEmailEnv ? '✅ 설정됨' : '❌ 미설정 (Vercel env 추가 필요)'}
              />
              <DiagRow
                label="이메일 일치"
                value={debug.superAdminEmailMatches ? '✅ 일치' : '❌ 불일치'}
              />
              <DiagRow
                label="admin_users 등록"
                value={debug.adminUsersRowExists ? '✅ 등록됨' : '❌ 등록 안 됨'}
              />
            </>
          )}
        </View>

        <Text className="font-body text-label-sm text-text-sub text-center max-w-md leading-relaxed">
          해결: Vercel 환경변수 `SUPER_ADMIN_EMAIL`을 위 로그인 이메일과 일치시킨 후 재배포하거나,{'\n'}
          기존 super-admin에게 본 이메일을 admin_users에 추가 요청.
        </Text>

        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={async () => {
              await logout();
              // 로그아웃 후 페이지 리로드 효과
              router.replace('/admin' as never);
            }}
            className="px-6 py-3 rounded-md border border-outline-warm bg-surface"
          >
            <Text className="font-body-bold text-body-md text-text-pri">로그아웃</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/' as never)}
            className="px-6 py-3 rounded-md border border-outline-warm bg-surface"
          >
            <Text className="font-body text-body-md text-text-pri">홈으로</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-baseline gap-3">
      <Text className="font-body text-label-sm text-text-sub">{label}</Text>
      <Text className="font-body text-label-sm text-text-pri text-right flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
