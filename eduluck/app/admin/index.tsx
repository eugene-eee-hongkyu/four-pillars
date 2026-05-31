// /admin — admin 로그인 페이지.
// Google OAuth 버튼 + 로그인 후 자동 /admin/subjects 리다이렉트.

import { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchAdminMe } from '@/lib/admin/client';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 이미 Google 로그인된 admin이면 바로 subjects로
  useEffect(() => {
    if (loading || !user) return;
    fetchAdminMe().then((me) => {
      if (me?.isAdmin) {
        router.replace('/admin/subjects' as never);
      }
    });
  }, [user, loading, router]);

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

        <View className="w-full max-w-md mt-6">
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <GoogleLoginButton redirectPath="/admin/subjects" />
          )}
        </View>

        <Text className="font-body text-label-sm text-text-sub text-center max-w-md leading-relaxed mt-4">
          ⚠️ 등록된 어드민 계정만 접근 가능합니다.{'\n'}
          접근 권한이 없는 계정으로 로그인하면 차단됩니다.
        </Text>
      </ScrollView>
    </View>
  );
}
