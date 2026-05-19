// 화면 4: 자녀 만세력 — 친절 가이드 + saju 용어 펼침
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { PalcaTable } from '@/components/manse/PalcaTable';
import { manseToPalcaPillars } from '@/components/manse/palca-mapper';
import { ManseFooter } from '@/components/manse/ManseFooter';
import { OhaengBar } from '@/components/manse/OhaengBar';
import { DaeunStrip } from '@/components/manse/DaeunStrip';
import { SewunMarker } from '@/components/manse/SewunMarker';
import { EssenceCard } from '@/components/manse/EssenceCard';
import { HagunCoreCard } from '@/components/manse/HagunCoreCard';
import { GongbuGuiCard } from '@/components/manse/GongbuGuiCard';
import { HagunUnsungCard } from '@/components/manse/HagunUnsungCard';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function ChildManse() {
  const router = useRouter();
  const { state } = useFlow();
  const [showPro, setShowPro] = useState(false);
  const m = state.childManse;
  const name = state.child.nickname || '아이';

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <StepIndicator current={4} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          {name}의 만세력
        </Text>

        {m ? (
          <>
            {/* 친절 가이드 — saju 모르는 어머니 부담 ↓ */}
            <View className="bg-secondary-container/50 p-card-padding rounded-md border border-outline-warm">
              <Text className="font-body text-body-md text-text-pri leading-relaxed">
                {name}의 본질을 나타내는 핵심 글자 4개예요. 가운데 황금색이 <Text className="font-body-bold text-primary">일간(日干)</Text>으로 가장 중요한 본질이고, 나머지 세 기둥과 관계를 따져 학운을 풀이합니다.
              </Text>
            </View>

            <PalcaTable {...manseToPalcaPillars(m)} />

            {/* 학운 핵심 카드 4종 — 정통 명리 풀이를 어머니가 즉시 알아볼 수 있게 */}
            <EssenceCard manse={m} nickname={name} />
            <HagunCoreCard manse={m} />
            <GongbuGuiCard manse={m} />
            <HagunUnsungCard manse={m} />

            {/* 정통 만세력 토글 — 명리 검증 가능한 상세 정보 */}
            <Pressable
              onPress={() => setShowPro(!showPro)}
              className="flex-row items-center justify-between px-card-padding py-3 rounded-md border border-outline-warm bg-surface-container-low"
            >
              <Text className="font-body-bold text-label-md text-text-pri">
                정통 만세력 자세히 보기
              </Text>
              <Text className="font-body text-label-md text-text-sub">
                {showPro ? '▴ 접기' : '▾ 펼치기'}
              </Text>
            </Pressable>

            {showPro && (
              <View className="gap-4">
                <ManseFooter manse={m} />
                <OhaengBar counts={m.elementCounts} />
                <DaeunStrip daeun={m.luckCycles.daeun} />
                <SewunMarker sewun={m.luckCycles.sewun} />
              </View>
            )}

            <Text className="font-body text-label-sm text-text-sub text-center">
              위 정보를 토대로 학년에 맞춰 풀이를 드릴게요.
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
