// 화면 10: 어머니 만세력 + relation-mini SSE (자녀-어머니 관계 1~2문장 hook)
// DESIGN v1.1 §10 P0 #2: 사주팔자 표 = 화면 4 패턴 단일 (PalcaTable 재사용)
// DESIGN v1.1 §10 P0 #4: "AI 분석 완료" 배지 금지 → "분석 완료" 또는 제거

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
import { MotherChildSyncCard } from '@/components/manse/MotherChildSyncCard';
import { hydrateManse } from '@/lib/manse/hydrate';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

export default function MotherManse() {
  const router = useRouter();
  const { state } = useFlow();
  const [showPro, setShowPro] = useState(false);
  const m = state.motherManse ? hydrateManse(state.motherManse) : null;
  const childM = state.childManse ? hydrateManse(state.childManse) : null;
  const childName = state.child.nickname || '아이';

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6">
        <StepIndicator current={10} />
        <Text className="font-heading-bold text-headline-lg text-text-pri">어머니의 만세력</Text>

        {m ? (
          <>
            <PalcaTable {...manseToPalcaPillars(m)} />

            {/* 어머니-자녀 합 카드 — 자녀 만세력 있을 때만 */}
            {childM && (
              <MotherChildSyncCard
                childManse={childM}
                motherManse={m}
                childNickname={childName}
              />
            )}

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
          </>
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
