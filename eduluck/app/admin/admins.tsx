// /admin/admins — super-admin 전용 admin_users CRUD.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface AdminRow {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export default function AdminsPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useAdminMe(true); // require super_admin
  const { logout } = useAuth();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 새 admin 폼
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/admins');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { admins: AdminRow[] };
      setAdmins(json.admins);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdd = async () => {
    if (!newEmail.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail.trim(), role: newRole, notes: newNotes.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setNewEmail('');
      setNewNotes('');
      setNewRole('admin');
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (row: AdminRow, nextRole: 'admin' | 'super_admin') => {
    try {
      const res = await adminFetch('/api/admin/admins', {
        method: 'PATCH',
        body: JSON.stringify({ id: row.id, role: nextRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'role 변경 실패');
    }
  };

  const handleDelete = async (row: AdminRow) => {
    const confirm =
      typeof window !== 'undefined' ? window.confirm(`${row.email}을 삭제할까요?`) : true;
    if (!confirm) return;
    try {
      const res = await adminFetch(`/api/admin/admins?id=${row.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      await fetchAdmins();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
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
            <Text className="font-body text-label-md text-text-sub">사용자</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/settings' as never)}>
            <Text className="font-body text-label-md text-text-sub">설정</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/admins' as never)}>
            <Text className="font-body-bold text-label-md text-primary">어드민</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/audit-log' as never)}>
            <Text className="font-body text-label-md text-text-sub">감사로그</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-label-sm text-text-sub">{me.email}</Text>
          <Pressable onPress={logout} className="px-3 py-1.5 rounded-md border border-outline-warm">
            <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-container-padding py-6 gap-6 max-w-3xl w-full self-center">
        {/* 새 admin 추가 폼 */}
        <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-3">
          <Text className="font-heading-bold text-headline-md text-text-pri">새 어드민 추가</Text>
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="px-4 py-3 rounded-md bg-surface border border-outline-warm font-body text-body-md"
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setNewRole('admin')}
              className={`flex-1 px-4 py-3 rounded-md border ${newRole === 'admin' ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'}`}
            >
              <Text className={`font-body text-label-md text-center ${newRole === 'admin' ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
                admin
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setNewRole('super_admin')}
              className={`flex-1 px-4 py-3 rounded-md border ${newRole === 'super_admin' ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'}`}
            >
              <Text className={`font-body text-label-md text-center ${newRole === 'super_admin' ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
                super_admin
              </Text>
            </Pressable>
          </View>
          <TextInput
            value={newNotes}
            onChangeText={setNewNotes}
            placeholder="메모 (선택)"
            placeholderTextColor="#9CA3AF"
            className="px-4 py-3 rounded-md bg-surface border border-outline-warm font-body text-body-md"
          />
          <Pressable
            onPress={handleAdd}
            disabled={!newEmail.trim() || submitting}
            className={`px-4 py-3 rounded-md items-center ${!newEmail.trim() || submitting ? 'bg-outline-warm' : 'bg-primary'}`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-body-bold text-label-md text-surface-container-low">추가</Text>
            )}
          </Pressable>
          {error && <Text className="font-body text-label-sm text-fire">{error}</Text>}
        </View>

        {/* 리스트 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-md text-text-pri">현재 어드민 ({admins.length}명)</Text>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            admins.map((a) => (
              <View
                key={a.id}
                className="flex-row items-center gap-3 p-card-padding rounded-md border border-outline-warm bg-surface-container-low"
              >
                <View className="flex-1 gap-1">
                  <Text className="font-body-bold text-body-md text-text-pri">{a.email}</Text>
                  <Text className="font-body text-label-sm text-text-sub">
                    {a.role} · 생성 {new Date(a.created_at).toLocaleDateString('ko-KR')}
                    {a.created_by ? ` · by ${a.created_by}` : ''}
                  </Text>
                  {a.notes && (
                    <Text className="font-body text-label-sm text-text-sub italic">{a.notes}</Text>
                  )}
                </View>
                <View className="gap-1">
                  <Pressable
                    onPress={() => handleChangeRole(a, a.role === 'admin' ? 'super_admin' : 'admin')}
                    className="px-3 py-1.5 rounded-md border border-outline-warm"
                  >
                    <Text className="font-body text-label-sm text-text-pri">
                      {a.role === 'admin' ? '→ super' : '→ admin'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(a)}
                    className="px-3 py-1.5 rounded-md border border-fire"
                  >
                    <Text className="font-body text-label-sm text-fire">삭제</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
