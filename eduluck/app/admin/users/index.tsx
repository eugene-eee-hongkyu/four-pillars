// /admin/users — 카카오 로그인 사용자 리스트.
//
// - 체크박스: "정밀 진단 다시 하기" 권한 토글. 체크 시 해당 사용자에게만
//   첫 화면 history 카드 "다시 진단" 버튼 노출 (만세력부터 재실행).
// - 행 클릭: 그 사용자가 본 사주(세션) 상세 → /admin/users/[userId] (조회·삭제).

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface KakaoUser {
  userId: string;
  email: string | null;
  nickname: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  redoEnabled: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('ko-KR');
  } catch {
    return '-';
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useAdminMe(); // admin 이상
  const { logout } = useAuth();

  const [users, setUsers] = useState<KakaoUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 토글 진행 중인 userId (중복 클릭·낙관적 UI 가드) */
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { users: KakaoUser[] };
      setUsers(json.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (u: KakaoUser) => {
    if (togglingId) return;
    setTogglingId(u.userId);
    setError(null);
    const next = !u.redoEnabled;
    // 낙관적 업데이트
    setUsers((prev) =>
      prev.map((x) => (x.userId === u.userId ? { ...x, redoEnabled: next } : x)),
    );
    try {
      const res = next
        ? await adminFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ userId: u.userId }),
          })
        : await adminFetch(`/api/admin/users?userId=${u.userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      // 롤백
      setUsers((prev) =>
        prev.map((x) => (x.userId === u.userId ? { ...x, redoEnabled: u.redoEnabled } : x)),
      );
      setError(e instanceof Error ? e.message : '권한 변경 실패');
    } finally {
      setTogglingId(null);
    }
  };

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const grantedCount = users.filter((u) => u.redoEnabled).length;

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-container-padding py-3 border-b border-outline-warm">
        <View className="flex-row items-center gap-3">
          <Text className="font-heading-bold text-headline-md text-text-pri">eduluck admin</Text>
          <Pressable onPress={() => router.push('/admin/subjects' as never)}>
            <Text className="font-body text-label-md text-text-sub">진단</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/users' as never)}>
            <Text className="font-body-bold text-label-md text-primary">사용자</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/settings' as never)}>
            <Text className="font-body text-label-md text-text-sub">설정</Text>
          </Pressable>
          {me.role === 'super_admin' && (
            <>
              <Pressable onPress={() => router.push('/admin/admins' as never)}>
                <Text className="font-body text-label-md text-text-sub">어드민</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/admin/audit-log' as never)}>
                <Text className="font-body text-label-md text-text-sub">감사로그</Text>
              </Pressable>
            </>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-label-sm text-text-sub">{me.email}</Text>
          <Pressable onPress={logout} className="px-3 py-1.5 rounded-md border border-outline-warm">
            <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-padding py-6 gap-4 max-w-3xl w-full self-center"
      >
        <View className="gap-1">
          <Text className="font-heading-bold text-headline-md text-text-pri">
            카카오 로그인 사용자
          </Text>
          <Text className="font-body text-label-sm text-text-sub leading-relaxed">
            오른쪽 "재진단 ON/OFF"를 켜면 그 사용자에게만 첫 화면 "이전에 본 진단" 카드에 "다시 진단"
            버튼이 보입니다(만세력부터 재실행). "상세"를 누르면 그 사용자가 본 사주를 보고 삭제할 수 있어요.
          </Text>
          <Text className="font-body text-label-sm text-text-sub mt-1">
            전체 {users.length}명 · 재진단 허용 {grantedCount}명
          </Text>
        </View>

        {error && <Text className="font-body text-label-sm text-fire">{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" />
        ) : users.length === 0 ? (
          <Text className="font-body text-body-md text-text-sub">
            카카오로 로그인한 사용자가 아직 없어요.
          </Text>
        ) : (
          <View className="gap-2">
            {users.map((u) => {
              const busy = togglingId === u.userId;
              return (
                <View
                  key={u.userId}
                  className="flex-row items-center gap-3 p-card-padding rounded-md border border-outline-warm bg-surface-container-low"
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="font-body-bold text-body-md text-text-pri">
                      {u.nickname}
                      {u.email ? ` · ${u.email}` : ''}
                    </Text>
                    <Text className="font-body text-label-sm text-text-sub">
                      가입 {formatDate(u.createdAt)} · 최근 로그인 {formatDate(u.lastSignInAt)}
                    </Text>
                  </View>

                  {/* 재진단 ON/OFF 토글 */}
                  <Pressable
                    onPress={() => handleToggle(u)}
                    disabled={busy}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: u.redoEnabled }}
                    accessibilityLabel="재진단 허용"
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                      u.redoEnabled ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'
                    }`}
                    style={({ pressed }) => ({ opacity: pressed || busy ? 0.6 : 1 })}
                  >
                    <View
                      className={`w-2 h-2 rounded-full ${u.redoEnabled ? 'bg-primary' : 'bg-outline-warm'}`}
                    />
                    <Text
                      className={`font-body-bold text-label-sm ${u.redoEnabled ? 'text-primary' : 'text-text-sub'}`}
                    >
                      재진단 {u.redoEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>

                  {/* 상세 버튼 */}
                  <Pressable
                    onPress={() => router.push(`/admin/users/${u.userId}` as never)}
                    accessibilityRole="button"
                    accessibilityLabel={`${u.nickname} 사주 보기`}
                    className="flex-row items-center gap-1 px-3 py-2 rounded-md border border-outline-warm bg-surface"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text className="font-body-bold text-label-sm text-text-pri">상세</Text>
                    <Text className="font-body text-label-md text-text-sub">›</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
