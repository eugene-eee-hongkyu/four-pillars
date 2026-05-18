// 화면 10: 어머니 만세력 + relation-mini SSE (자녀-어머니 관계 1~2문장 hook)
// DESIGN v1.1 §10 P0 #2: 사주팔자 표 = 화면 4 패턴 단일 (PalcaTable 재사용)
// DESIGN v1.1 §10 P0 #4: "AI 분석 완료" 배지 금지 → "분석 완료" 또는 제거

import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { PalcaTable } from '@/components/manse/PalcaTable';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { useFlow } from '@/lib/flow/context';

export default function MotherManse() {
  const router = useRouter();
  const { state } = useFlow();
  const m = state.motherManse;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
        <Text className="font-heading-bold text-headline-lg text-text-pri">어머니의 만세력</Text>

        {m ? (
          <PalcaTable
            yearPillarHanja={m.yearPillarHanja}
            monthPillarHanja={m.monthPillarHanja}
            dayPillarHanja={m.dayPillarHanja}
            hourPillarHanja={m.hourPillarHanja}
          />
        ) : (
          <Text className="font-body text-body-md text-text-sub">만세력 데이터가 없어요.</Text>
        )}

        <View className="border-t border-outline-warm pt-6 mt-2">
          <Text className="font-heading text-headline-md text-text-pri mb-3">
            어머니와 {state.child.nickname || '아이'}의 관계
          </Text>
          {state.sessionId && state.childSubjectId && state.motherSubjectId ? (
            <StreamingBody
              endpoint="/api/relation-mini"
              body={{
                sessionId: state.sessionId,
                childSubjectId: state.childSubjectId,
                motherSubjectId: state.motherSubjectId,
              }}
              skeletonLines={2}
            />
          ) : null}
        </View>
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => router.push('/(flow)/interpret-premium')}>정밀 진단 받기</Button>
      </StickyCTA>
    </View>
  );
}
