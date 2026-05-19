// 화면 4: 자녀 만세력 (placeholder — Phase 5-C 풀 구현)
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { PalcaTable } from '@/components/manse/PalcaTable';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function ChildManse() {
  const router = useRouter();
  const { state } = useFlow();
  const m = state.childManse;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <StepIndicator current={4} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          {state.child.nickname || '아이'}의 만세력
        </Text>
        {m ? (
          <>
            <PalcaTable
              yearPillarHanja={m.yearPillarHanja}
              monthPillarHanja={m.monthPillarHanja}
              dayPillarHanja={m.dayPillarHanja}
              hourPillarHanja={m.hourPillarHanja}
            />
            <Text className="font-body text-body-md text-text-sub">
              일간: {m.dayPillar[0]} / 신살 강조: {m.shensha.strong.join(', ') || '없음'}
            </Text>
            <Text className="font-body text-label-sm text-text-sub">
              (Phase 5-C에서 십성·신살·12운성·합충·오행·대운 카드 추가 예정)
            </Text>
          </>
        ) : (
          <Text className="font-body text-body-md text-text-sub">만세력 데이터가 없어요.</Text>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => router.push('/(flow)/interpret-free')}>학운 진단 받기</Button>
      </StickyCTA>
    </View>
  );
}
