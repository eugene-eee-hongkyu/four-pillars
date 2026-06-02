// /admin/users/[userId] — 사용자가 본 사주(세션) 상세 + 삭제.
//
// - 사용자 기본 정보(닉네임·이메일) + 본 사주 카드 리스트.
// - 각 카드: 자녀 닉네임(마스킹)·생년월일·학운 라벨·부모 입력 여부 + 삭제 버튼.
// - "원본 보기" 토글: 마스킹 해제 (audit log 기록).
// - 삭제: 세션 삭제 → subjects·interpretations cascade. 확인 모달 후 실행.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface Saju {
  sessionId: string;
  createdAt: string;
  hasChild: boolean;
  childNickname: string | null;
  gender: string | null;
  grade: string | null;
  birth: { year: number; month: number; day: number; hour: number | null; minute: number | null } | null;
  birthLocation: string | null;
  hasMother: boolean;
  hasFather: boolean;
  hagunLabel: string | null;
}

interface UserInfo {
  userId: string;
  email: string | null;
  nickname: string;
}

const GRADE_LABELS: Record<string, string> = {
  'elem-1': '초1', 'elem-2': '초2', 'elem-3': '초3', 'elem-4': '초4', 'elem-5': '초5', 'elem-6': '초6',
  'mid-1': '중1', 'mid-2': '중2', 'mid-3': '중3',
  'high-1': '고1', 'high-2': '고2', 'high-3': '고3',
  adult: '성인',
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function formatBirth(b: Saju['birth']): string {
  if (!b) return '-';
  const date = `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
  const time = b.hour !== null ? ` · ${String(b.hour).padStart(2, '0')}:${String(b.minute ?? 0).padStart(2, '0')}` : ' · 시간모름';
  return date + time;
}

export default function UserDetailPage() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { me, loading: authLoading } = useAdminMe();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [sajus, setSajus] = useState<Saju[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unmask, setUnmask] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!me || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}?unmask=${unmask ? '1' : '0'}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { user: UserInfo; sajus: Saju[] };
      setUser(json.user);
      setSajus(json.sajus);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me, userId, unmask]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDelete = async (s: Saju) => {
    if (deletingId) return;
    const who = s.childNickname ?? '이 사주';
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(`${who} (${formatBirth(s.birth)}) 사주를 삭제할까요?\n진단 결과까지 함께 영구 삭제되며 되돌릴 수 없습니다.`)
        : true;
    if (!confirmed) return;
    setDeletingId(s.sessionId);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}?sessionId=${s.sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setSajus((prev) => prev.filter((x) => x.sessionId !== s.sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        <Pressable onPress={() => router.push('/admin/users' as never)}>
          <Text className="font-body text-label-md text-text-sub">‹ 사용자 목록</Text>
        </Pressable>

        <View className="flex-row items-end justify-between flex-wrap gap-2">
          <View className="gap-0.5">
            <Text className="font-heading-bold text-headline-md text-text-pri">
              {user?.nickname ?? '회원'}
            </Text>
            {user?.email && (
              <Text className="font-body text-label-sm text-text-sub">{user.email}</Text>
            )}
            <Text className="font-body text-label-sm text-text-sub">본 사주 {sajus.length}건</Text>
          </View>
          <Pressable
            onPress={() => setUnmask((v) => !v)}
            className={`px-3 py-1.5 rounded-md border ${unmask ? 'border-primary bg-secondary-container' : 'border-outline-warm'}`}
          >
            <Text className={`font-body text-label-sm ${unmask ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
              {unmask ? '원본 보는 중' : '원본 보기'}
            </Text>
          </Pressable>
        </View>

        {error && <Text className="font-body text-label-sm text-fire">{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" />
        ) : sajus.length === 0 ? (
          <Text className="font-body text-body-md text-text-sub">본 사주가 없어요.</Text>
        ) : (
          <View className="gap-3">
            {sajus.map((s) => {
              const isDeleting = deletingId === s.sessionId;
              return (
                <View
                  key={s.sessionId}
                  className="rounded-md border border-outline-warm bg-surface-container-low overflow-hidden"
                >
                  <View className="p-card-padding gap-2">
                    <View className="flex-row items-baseline justify-between">
                      <Text className="font-heading-bold text-headline-md text-text-pri">
                        {s.childNickname ?? '(자녀 정보 없음)'}
                      </Text>
                      <Text className="font-body text-label-sm text-text-sub">
                        {formatDateTime(s.createdAt)}
                      </Text>
                    </View>
                    {s.birth && (
                      <Text className="font-body text-label-md text-text-sub">
                        {formatBirth(s.birth)}
                        {s.grade ? ` · ${GRADE_LABELS[s.grade] ?? s.grade}` : ''}
                        {s.gender ? ` · ${s.gender === 'male' ? '남' : '여'}` : ''}
                        {s.birthLocation ? ` · ${s.birthLocation}` : ''}
                      </Text>
                    )}
                    <View className="flex-row gap-2 flex-wrap mt-1">
                      {s.hagunLabel && (
                        <View className="px-3 py-1 rounded-full bg-secondary-container">
                          <Text className="font-body-bold text-label-md text-primary">{s.hagunLabel}</Text>
                        </View>
                      )}
                      {s.hasMother && (
                        <View className="px-3 py-1 rounded-full border border-outline-warm">
                          <Text className="font-body text-label-sm text-text-sub">엄마 사주</Text>
                        </View>
                      )}
                      {s.hasFather && (
                        <View className="px-3 py-1 rounded-full border border-outline-warm">
                          <Text className="font-body text-label-sm text-text-sub">아빠 사주</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(s)}
                    disabled={isDeleting}
                    accessibilityRole="button"
                    accessibilityLabel="사주 삭제"
                    className="flex-row items-center justify-center py-3 border-t border-outline-warm/60 bg-surface"
                    style={({ pressed }) => ({ opacity: pressed || isDeleting ? 0.6 : 1 })}
                  >
                    <Text className="font-body-bold text-label-md text-fire">
                      {isDeleting ? '⏳ 삭제 중…' : '🗑 사주 삭제'}
                    </Text>
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
