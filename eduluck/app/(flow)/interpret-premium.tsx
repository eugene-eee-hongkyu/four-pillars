// 화면 11 ★ v5: 정밀 진단 Part 1 (10 섹션) + Part 2 prefetch + deep-dive 진입
//
// v5 흐름:
//   1. Part 1 (10 섹션) StreamingBody — 본질·인성·관계·즉시 행동
//   2. Part 1 완료 → "📖 더 자세한 진로·미래 보기" 버튼 노출 (화면 끝)
//      + 5초 후 Part 2 백그라운드 prefetch (옵션 B 확정)
//   3. "더 자세히" 클릭 → Part 2 영역 노출 (캐시 hit 즉시 / 미캐시 시 StreamingBody)
//   4. Part 2 완료 → 학습 특성·공유 버튼·"📋 더 자세히 알고 싶은 영역 선택" 버튼

import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { ShareButton } from '@/components/interpret/ShareButton';
import { SilentSsePrefetch } from '@/components/interpret/SilentSsePrefetch';
import { TraitScoreCard } from '@/components/manse/TraitScoreCard';
import { HagunSignerBreakdown } from '@/components/manse/HagunSignerBreakdown';
import { DirectionCard } from '@/components/manse/DirectionCard';
import { useFlow } from '@/lib/flow/context';
import { StepIndicator } from '@/components/ui/StepIndicator';

// Part 1 — 10 섹션 skeleton 헤더
const PART1_SECTION_HEADERS = [
  '1. 시작', '2. 본질', '3. 강점', '4. 약점·주의', '5. 환경 설계',
  '6. 훈육 가이드', '7. 건강', '8. 엄마-자녀 합', '9. 아빠-자녀 합', '10. 강요 금지',
];
// 첫 청크(§1·§2)가 reveal되기 전까지만 노출되는 stages.
// 그 이후 단계는 본문이 직접 보여주고 progress bar 라벨이 '다음 부분 (§3·§4) 정리 중'으로
// 표시되므로 stages로 가짜 진행을 미리 띄울 필요 ✗.
const PART1_STAGES = [
  { at: 0, label: '사주 정리 중' },
  { at: 8, label: '시작·본질 정리 중' },
];

// Part 2 — 10 섹션 skeleton 헤더 (v5.1: §14를 조심한 해로 이동 — §13 흐름 직후 worst year zoom in)
const PART2_SECTION_HEADERS = [
  '11. 친구·또래', '12. 학원·선생님', '13. 현재~앞으로의 흐름', '14. 가장 조심해야 하는 한 해', '15. 국가·해외 운',
  '16. 직업·진로 흐름', '17. 전공 볼게요', '18. 학교 볼게요', '19. 본질을 깨우는 효과적 액션', '20. 어머니께 한 마디',
];
const PART2_STAGES = [
  { at: 0, label: '진로·미래 정리 중' },
  { at: 8, label: '친구·학원 정리 중' },
];

export default function InterpretPremium() {
  const router = useRouter();
  const {
    state,
    setPremiumPart1Text,
    setPremiumPart2Text,
  } = useFlow();
  const [part1Done, setPart1Done] = useState(false);
  const [part2Visible, setPart2Visible] = useState(false);
  const [part2Done, setPart2Done] = useState(false);

  // 캐시 hit (또는 동일 자녀 재진입) → 즉시 done + Part 2 보이기 (이미 본 적 있음)
  useEffect(() => {
    if (state.premiumPart1Text && !part1Done) setPart1Done(true);
  }, [state.premiumPart1Text, part1Done]);
  useEffect(() => {
    if (state.premiumPart2Text && !part2Done) {
      setPart2Done(true);
      setPart2Visible(true);  // 캐시 있으면 자동 노출
    }
  }, [state.premiumPart2Text, part2Done]);

  const sessionReady = !!(state.sessionId && state.childSubjectId);
  const part2Body = sessionReady ? {
    sessionId: state.sessionId,
    childSubjectId: state.childSubjectId,
    motherSubjectId: state.motherSubjectId,
    fatherSubjectId: state.fatherSubjectId,
  } : null;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-6">
        <View className="px-container-padding gap-2">
          <StepIndicator current={5} />
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 정밀 학운
          </Text>
        </View>

        {/* Hero — 학운 그릇 */}
        {state.childManse && (
          <View className="px-container-padding">
            <HagunSignerBreakdown manse={state.childManse} />
          </View>
        )}

        {/* 진로 방향성 10가지 */}
        {state.childManse?.directions && (
          <View className="px-container-padding">
            <DirectionCard directions={state.childManse.directions} compact={true} />
          </View>
        )}

        {/* === Part 1 (10 섹션) === */}
        <View className="px-container-padding">
          <Text className="font-body-bold text-label-md text-text-pri mb-1">
            📖 Part 1 · 본질·관계·즉시 행동 (10 섹션)
          </Text>
        </View>
        {state.premiumPart1Text ? (
          <View className="p-card-padding gap-4">
            <InterpretBody text={state.premiumPart1Text} />
          </View>
        ) : sessionReady ? (
          <StreamingBody
            endpoint="/api/interpret-premium-part1"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
              fatherSubjectId: state.fatherSubjectId,
            }}
            sectionHeaders={PART1_SECTION_HEADERS}
            stages={PART1_STAGES}
            expectedDurationSec={60}
            onComplete={(text) => {
              setPremiumPart1Text(text);
              setPart1Done(true);
            }}
          />
        ) : null}

        {/* Part 2 백그라운드 prefetch — Part 1 완료 + Part 2 미완 + part2Body 있을 때 */}
        {part1Done && !state.premiumPart2Text && part2Body && (
          <SilentSsePrefetch
            endpoint="/api/interpret-premium-part2"
            body={part2Body}
            delayMs={5000}
            onComplete={(text) => setPremiumPart2Text(text)}
          />
        )}

        {/* === Part 1 완료 → "더 자세히 진로·미래 보기" 버튼 (Part 1 화면의 끝) === */}
        {part1Done && !part2Visible && !state.premiumPart2Text && (
          <View className="px-container-padding mt-4">
            <Button onPress={() => setPart2Visible(true)}>
              📖 더 자세한 진로·미래 보기 (10 섹션)
            </Button>
          </View>
        )}

        {/* === Part 2 (10 섹션) — 버튼 누른 후 또는 캐시 hit 시 === */}
        {(part2Visible || state.premiumPart2Text) && (
          <>
            <View className="px-container-padding mt-2">
              <Text className="font-body-bold text-label-md text-text-pri mb-1">
                🔮 Part 2 · 학원·진로·미래 (10 섹션)
              </Text>
            </View>
            {state.premiumPart2Text ? (
              <View className="p-card-padding gap-4">
                <InterpretBody text={state.premiumPart2Text} />
              </View>
            ) : sessionReady ? (
              <StreamingBody
                endpoint="/api/interpret-premium-part2"
                body={{
                  sessionId: state.sessionId,
                  childSubjectId: state.childSubjectId,
                  motherSubjectId: state.motherSubjectId,
                  fatherSubjectId: state.fatherSubjectId,
                }}
                sectionHeaders={PART2_SECTION_HEADERS}
                stages={PART2_STAGES}
                expectedDurationSec={60}
                onComplete={(text) => {
                  setPremiumPart2Text(text);
                  setPart2Done(true);
                }}
              />
            ) : null}

            {/* Part 2 완료 후 보조 요소들 — 학습 특성 · 공유 · 다음 단계 */}
            {part2Done && state.childManse?.studentTraits && (
              <View className="px-container-padding">
                <TraitScoreCard traits={state.childManse.studentTraits} compact={true} />
              </View>
            )}

            {part2Done && state.sessionId && (
              <View className="px-container-padding mt-2">
                <ShareButton
                  sessionId={state.sessionId}
                  nickname={state.child.nickname || '아이'}
                />
              </View>
            )}

            {part2Done && (
              <View className="px-container-padding mt-4">
                <Button onPress={() => router.push('/interpret-deep-select')}>
                  📋 더 자세히 알고 싶은 영역 선택 (20 섹션)
                </Button>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
