// admin 레이아웃 — 카카오 사용자 UI(AppHeader 등) 격리.
// admin 인증 가드는 각 페이지에서 useAdminMe로 처리 (login 페이지는 제외).

import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBF8F1' },
      }}
    />
  );
}
