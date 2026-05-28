import '../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlowProvider } from '@/lib/flow/context';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AnalyticsBridge } from '@/components/analytics/AnalyticsBridge';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FlowProvider>
        <AnalyticsBridge />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FBF8F1' },
          }}
        />
        <VersionFooter />
      </FlowProvider>
    </SafeAreaProvider>
  );
}
