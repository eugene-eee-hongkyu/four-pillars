import '../global.css';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FlowProvider } from '@/lib/flow/context';
import { AppHeader } from '@/components/AppHeader';
import { AnalyticsBridge } from '@/components/analytics/AnalyticsBridge';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FlowProvider>
        <AnalyticsBridge />
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FBF8F1' }}>
          <AppHeader />
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FBF8F1' },
              }}
            />
          </View>
        </SafeAreaView>
      </FlowProvider>
    </SafeAreaProvider>
  );
}
