import { Stack } from 'expo-router';

export default function FlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBF8F1' },
      }}
    />
  );
}
