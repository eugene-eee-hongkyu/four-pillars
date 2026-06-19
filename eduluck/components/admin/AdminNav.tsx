// 어드민 상단 네비 — 모든 /admin 페이지 공용.
// 선택된 탭은 배경 채움(bg-secondary-container) + 굵은 primary 글씨로 명확히 구분.

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export type AdminTab = 'subjects' | 'users' | 'settings' | 'admins' | 'audit-log';

const TABS: { key: AdminTab; label: string; path: string; superOnly?: boolean }[] = [
  { key: 'subjects', label: '진단', path: '/admin/subjects' },
  { key: 'users', label: '사용자', path: '/admin/users' },
  { key: 'settings', label: '설정', path: '/admin/settings' },
  { key: 'admins', label: '어드민', path: '/admin/admins', superOnly: true },
  { key: 'audit-log', label: '감사로그', path: '/admin/audit-log', superOnly: true },
];

export function AdminNav({
  active,
  role,
  email,
  onLogout,
}: {
  active: AdminTab;
  role: string;
  email: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const isSuper = role === 'super_admin';

  return (
    <View
      className="flex-row items-center justify-between px-container-padding py-3 border-b border-outline-warm bg-surface-container-low z-10"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <View className="flex-row items-center gap-1.5">
        <Text className="font-heading-bold text-headline-md text-text-pri mr-1.5">eduluck admin</Text>
        {TABS.filter((t) => !t.superOnly || isSuper).map((t) => {
          const selected = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => router.push(t.path as never)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`px-3 py-1.5 rounded-md ${selected ? 'bg-secondary-container' : ''}`}
            >
              <Text
                className={`text-label-md ${selected ? 'font-body-bold text-primary' : 'font-body text-text-sub'}`}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="font-body text-label-sm text-text-sub">{email}</Text>
        <Text className="font-body text-label-sm text-primary">[{role}]</Text>
        <Pressable onPress={onLogout} className="px-3 py-1.5 rounded-md border border-outline-warm">
          <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}
