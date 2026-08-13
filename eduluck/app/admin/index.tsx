// /admin — admin 로그인 (id/pw). 유저 카카오/구글 OAuth 와 완전 분리.
// 이미 유효한 admin 세션이 있으면 /admin/subjects 로 자동 이동.

import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAdminMe } from '@/lib/admin/client';
import { getAdminToken, adminLogin } from '@/lib/admin/session';

export default function AdminLogin() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기존 세션 확인 — 유효하면 바로 콘솔로
  useEffect(() => {
    if (!getAdminToken()) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    fetchAdminMe().then((res) => {
      if (cancelled) return;
      if (res.isAdmin) {
        router.replace('/admin/subjects' as never);
      } else {
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    setSubmitting(true);
    const res = await adminLogin(username.trim(), password);
    setSubmitting(false);
    if (res.ok) {
      router.replace('/admin/subjects' as never);
    } else {
      setError(res.error ?? '로그인에 실패했습니다.');
    }
  };

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

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

        <View className="w-full max-w-md gap-3">
          <View className="gap-1">
            <Text className="font-body text-label-sm text-text-sub">아이디</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="admin id"
              placeholderTextColor="#9CA3AF"
              className="px-4 py-3 rounded-md border border-outline-warm bg-surface-container-low font-body text-body-md text-text-pri"
              onSubmitEditing={submit}
            />
          </View>
          <View className="gap-1">
            <Text className="font-body text-label-sm text-text-sub">비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              className="px-4 py-3 rounded-md border border-outline-warm bg-surface-container-low font-body text-body-md text-text-pri"
              onSubmitEditing={submit}
            />
          </View>

          {error && (
            <Text className="font-body text-label-sm text-fire text-center">{error}</Text>
          )}

          <Pressable
            onPress={submit}
            disabled={submitting}
            className={`px-6 py-3 rounded-md items-center ${submitting ? 'bg-outline-warm' : 'bg-primary'}`}
          >
            <Text className="font-body-bold text-body-md text-white">
              {submitting ? '로그인 중…' : '로그인'}
            </Text>
          </Pressable>
        </View>

        <Text className="font-body text-label-sm text-text-sub text-center max-w-md leading-relaxed mt-2">
          어드민 전용 계정으로만 접근할 수 있습니다.{'\n'}
          일반 사용자 로그인(카카오)과 분리되어 있습니다.
        </Text>
      </ScrollView>
    </View>
  );
}
