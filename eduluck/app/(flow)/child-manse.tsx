// 화면 3 (재설계): 가족 만세력 — 자녀 중심 + 어머니·아빠 만세력 카드 + 합 카드 inline
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
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
import { HagunGuideCard } from '@/components/manse/HagunGuideCard';
import { MotherChildSyncCard } from '@/components/manse/MotherChildSyncCard';
import { hydrateManse } from '@/lib/manse/hydrate';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function ChildManse() {
  const router = useRouter();
  const { state } = useFlow();
  const [showPro, setShowPro] = useState(false);
  const m = state.childManse ? hydrateManse(state.childManse) : null;
  const mother = state.motherManse ? hydrateManse(state.motherManse) : null;
  const father = state.fatherManse ? hydrateManse(state.fatherManse) : null;
  const name = state.child.nickname || '아이';

  useEffect(() => {
    track(EVENTS.CHILD_MANSE_VIEW);
  }, []);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="px-container-padding pt-12 pb-32 gap-6"
      >
        <StepIndicator current={3} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">
          가족 만세력
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

            {/* === 어머니 만세력 (있으면) === */}
            {mother && (
              <View className="gap-3 mt-2 pt-4 border-t border-outline-warm">
                <Text className="font-heading text-headline-md text-text-pri">
                  어머니 만세력
                </Text>
                <PalcaTable {...manseToPalcaPillars(mother)} />
                <MotherChildSyncCard childManse={m} motherManse={mother} childNickname={name} />
              </View>
            )}

            {/* === 아빠 만세력 (있으면) === */}
            {father && (
              <View className="gap-3 mt-2 pt-4 border-t border-outline-warm">
                <Text className="font-heading text-headline-md text-text-pri">
                  아빠 만세력
                </Text>
                <PalcaTable {...manseToPalcaPillars(father)} />
                {/* 아빠-자녀 합 한 줄 hint — 명리 톤 */}
                <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
                  <Text className="font-body text-label-sm text-text-sub mb-1">아빠와 {name}의 합</Text>
                  <Text className="font-body text-body-md text-text-pri leading-relaxed">
                    아빠 사주는 {name}의 사회적 자원·물질 환경 변수예요. 진단에서 보조 풀이로 활용됩니다.
                  </Text>
                </View>
              </View>
            )}

            {/* 학운 명리 4축 학습 가이드 — 화면 카드들의 명리 근거 */}
            <HagunGuideCard />

            <Text className="font-body text-label-sm text-text-sub text-center">
              위 정보를 토대로 학년에 맞춰 풀이를 드릴게요.
            </Text>
          </>
        ) : (
          <Text className="font-body text-body-md text-text-sub">만세력 데이터가 없어요.</Text>
        )}
      </ScrollView>

      <StickyCTA>
        <Button onPress={() => { track(EVENTS.PREMIUM_START_CLICK); router.push('/(flow)/interpret-premium'); }}>정밀 진단 받기</Button>
      </StickyCTA>
    </View>
  );
}
