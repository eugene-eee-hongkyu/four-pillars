// /admin/audit-log — super-admin 전용 감사 로그 조회.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface LogRow {
  id: string;
  admin_email: string;
  action: string;
  target_id: string | null;
  query_params: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ACTIONS = [
  '', 'login', 'list_subjects', 'search_subjects', 'view_subject',
  'mask_off', 'add_admin', 'update_admin_role', 'remove_admin', 'view_audit_log',
  'list_users', 'grant_redo', 'revoke_redo', 'view_user', 'delete_session',
];

export default function AuditLogPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useAdminMe(true);
  const { logout } = useAuth();

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterAction) params.set('action', filterAction);
      if (filterEmail.trim()) params.set('adminEmail', filterEmail.trim());
      const res = await adminFetch(`/api/admin/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { logs: LogRow[] };
      setLogs(json.logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me, filterAction, filterEmail]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
          <Pressable onPress={() => router.push('/admin/admins' as never)}>
            <Text className="font-body text-label-md text-text-sub">어드민</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/audit-log' as never)}>
            <Text className="font-body-bold text-label-md text-primary">감사로그</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-label-sm text-text-sub">{me.email}</Text>
          <Pressable onPress={logout} className="px-3 py-1.5 rounded-md border border-outline-warm">
            <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <View className="px-container-padding py-3 gap-2 border-b border-outline-warm flex-row flex-wrap">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1">
          {ACTIONS.map((a) => (
            <Pressable
              key={a || 'all'}
              onPress={() => setFilterAction(a)}
              className={`px-3 py-1.5 rounded-full border ${filterAction === a ? 'border-primary bg-secondary-container' : 'border-outline-warm'}`}
            >
              <Text className={`font-body text-label-sm ${filterAction === a ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
                {a || 'all'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          value={filterEmail}
          onChangeText={setFilterEmail}
          placeholder="admin 이메일 필터"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          className="flex-1 px-3 py-1.5 rounded-md border border-outline-warm bg-surface-container-low font-body text-label-md"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="p-card-padding">
          <Text className="font-body text-body-md text-fire">{error}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {logs.map((l) => (
            <View key={l.id} className="px-container-padding py-3 border-b border-outline-warm/50 gap-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="font-body-bold text-label-md text-primary">{l.action}</Text>
                <Text className="font-body text-label-sm text-text-pri">{l.admin_email}</Text>
                <Text className="font-body text-label-sm text-text-sub">
                  {new Date(l.created_at).toLocaleString('ko-KR')}
                </Text>
              </View>
              {l.target_id && (
                <Text className="font-body text-label-sm text-text-sub">target: {l.target_id}</Text>
              )}
              {l.query_params && (
                <Text className="font-body text-label-sm text-text-sub" numberOfLines={2}>
                  {JSON.stringify(l.query_params)}
                </Text>
              )}
              {l.ip_address && (
                <Text className="font-body text-label-sm text-text-sub">IP: {l.ip_address}</Text>
              )}
            </View>
          ))}
          {logs.length === 0 && (
            <View className="p-card-padding">
              <Text className="font-body text-body-md text-text-sub">로그 없음</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
