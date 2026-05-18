import '../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlowProvider } from '@/lib/flow/context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FlowProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FBF8F1' },
          }}
        />
      </FlowProvider>
    </SafeAreaProvider>
  );
}
