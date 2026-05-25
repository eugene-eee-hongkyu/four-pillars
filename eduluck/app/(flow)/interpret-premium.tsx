// 화면 11 ★ v5: 정밀 진단 Part 1 (10 섹션) + Part 2 prefetch + deep-dive 진입
//
// v5 흐름:
//   1. Part 1 (10 섹션) StreamingBody — 본질·인성·관계·즉시 행동
//   2. Part 1 완료 → "📖 더 자세한 진로·미래 보기" 버튼 노출
//      + 5초 후 Part 2 백그라운드 prefetch (옵션 B 확정)
//   3. "더 자세히" 클릭 → Part 2 표시 (캐시 hit 즉시 / 미캐시 시 StreamingBody)
//   4. Part 2 완료 → "📋 더 자세히 알고 싶은 영역 선택" → interpret-deep-select 진입
//   5. 결제 가치 survey 2단계 (기존 유지) — Part 1 완료 후 노출

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { ShareButton } from '@/components/interpret/ShareButton';
import { SilentSsePrefetch } from '@/components/interpret/SilentSsePrefetch';
import { TraitScoreCard } from '@/components/manse/TraitScoreCard';
import { HagunSignerBreakdown } from '@/components/manse/HagunSignerBreakdown';
import { DirectionCard } from '@/components/manse/DirectionCard';
import { Toast } from '@/components/ui/Toast';
import { useFlow } from '@/lib/flow/context';
import { translateError } from '@/lib/errors/translate';
import { StepIndicator } from '@/components/ui/StepIndicator';

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const labels = ['전혀 아니에요', '아니에요', '보통', '괜찮아요', '매우 좋아요'];
  return (
    <View className="gap-3 mt-3">
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === n }}
            accessibilityLabel={`${n}점, ${labels[n - 1]}`}
            onPress={() => onChange(n)}
            className={`w-12 h-12 items-center justify-center rounded-full border ${
              value === n ? 'bg-secondary-container border-secondary' : 'border-outline-warm'
            }`}
          >
            <Text className="font-body-bold text-body-lg text-primary">{n}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row justify-between px-1">
        <Text className="font-body text-label-sm text-text-sub">{labels[0]}</Text>
        <Text className="font-body text-label-sm text-text-sub">{labels[4]}</Text>
      </View>
    </View>
  );
}

// Part 1 — 10 섹션 skeleton 헤더
const PART1_SECTION_HEADERS = [
  '1. 시작', '2. 본질', '3. 강점', '4. 약점·주의', '5. 환경 설계',
  '6. 훈육 가이드', '7. 건강', '8. 엄마-자녀 합', '9. 아빠-자녀 합', '10. 강요 금지',
];
const PART1_STAGES = [
  { at: 0, label: '사주 정리 중' },
  { at: 6, label: '본질·강점·약점 풀이 중' },
  { at: 16, label: '환경·훈육·건강 정리 중' },
  { at: 26, label: '엄마·아빠 합 + 강요 금지 마무리' },
];

// Part 2 — 10 섹션 skeleton 헤더
const PART2_SECTION_HEADERS = [
  '11. 친구·또래', '12. 학원·선생님', '13. 현재~앞으로의 흐름', '14. 국가·해외 운', '15. 직업·진로 흐름',
  '16. 전공 볼게요', '17. 학교 볼게요', '18. 가장 조심해야 하는 한 해', '19. 본질을 깨우는 효과적 액션', '20. 어머니께 한 마디',
];
const PART2_STAGES = [
  { at: 0, label: '진로·미래 정리 중' },
  { at: 8, label: '학원·흐름·해외 풀이 중' },
  { at: 18, label: '전공·학교 권유 정리 중' },
  { at: 28, label: '조심한 해·효과적 액션·마무리' },
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
  /** 0 = 진단 읽는 중, 1 = step1 (결제 가치), 2 = step2 (결제 의향), 3 = 제출 완료 */
  const [surveyStep, setSurveyStep] = useState<0 | 1 | 2 | 3>(0);
  const [valueScore, setValueScore] = useState(0);
  const [intentScore, setIntentScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleStep1Submit = async () => {
    if (valueScore === 0) return;
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, kind: 'mom-test-2', score: valueScore }),
      });
      setSurveyStep(2);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    }
  };

  const handleStep2Submit = async () => {
    if (intentScore === 0) return;
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, kind: 'pay-intent', score: intentScore }),
      });
      setSurveyStep(3);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : null));
    }
  };

  const handleStartSurvey = () => setSurveyStep(1);

  // 테스트 기간: 진입 시 캐시 무효 — 무조건 새 LLM 호출. 테스트 종료 시 이 effect 제거.
  useEffect(() => {
    setPremiumPart1Text(null);
    setPremiumPart2Text(null);
    setPart1Done(false);
    setPart2Visible(false);
    setPart2Done(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 캐시 hit (이미 part1Text 있음) → 즉시 part1Done
  useEffect(() => {
    if (state.premiumPart1Text && !part1Done) setPart1Done(true);
  }, [state.premiumPart1Text, part1Done]);
  useEffect(() => {
    if (state.premiumPart2Text && !part2Done) setPart2Done(true);
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
            expectedDurationSec={35}
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

        {/* === Part 1 완료 → "더 자세히 진로·미래 보기" 버튼 === */}
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
                expectedDurationSec={35}
                onComplete={(text) => {
                  setPremiumPart2Text(text);
                  setPart2Done(true);
                }}
              />
            ) : null}
          </>
        )}

        {/* === Part 2 완료 → "20 섹션 자세히 보기" 버튼 === */}
        {part2Done && (
          <View className="px-container-padding mt-4">
            <Button onPress={() => router.push('/interpret-deep-select')}>
              📋 더 자세히 알고 싶은 영역 선택 (20 섹션)
            </Button>
          </View>
        )}

        {/* 학습 특성 4가지 — Part 1 완료 후 공통 보조 */}
        {part1Done && state.childManse?.studentTraits && (
          <View className="px-container-padding">
            <TraitScoreCard traits={state.childManse.studentTraits} compact={true} />
          </View>
        )}

        {/* 공유 버튼 — Part 1 완료 후 */}
        {part1Done && state.sessionId && (
          <View className="px-container-padding mt-2">
            <ShareButton
              sessionId={state.sessionId}
              nickname={state.child.nickname || '아이'}
            />
          </View>
        )}

        {/* survey — Part 1 완료 후 (Part 2 안 보기로 결정한 사용자도 즉시 응답 가능) */}
        {part1Done && surveyStep === 0 && (
          <View className="px-container-padding pt-6 border-t border-outline-warm mt-4">
            <Text className="font-body text-body-md text-text-sub text-center mb-3">
              진단 다 보셨으면 짧은 응답 부탁드려요 (2가지)
            </Text>
            <Button onPress={handleStartSurvey}>응답 시작</Button>
          </View>
        )}

        {part1Done && surveyStep === 1 && (
          <View className="px-container-padding gap-2 pt-6 border-t border-outline-warm mt-4">
            <Text className="font-body text-label-sm text-text-sub">1 / 2</Text>
            <Text className="font-heading text-headline-md text-text-pri">
              정밀 진단이 결제할 만한 가치였나요?
            </Text>
            <StarRow value={valueScore} onChange={setValueScore} />
            <View className="mt-4">
              <Button onPress={handleStep1Submit} disabled={valueScore === 0}>
                다음 (2/2)
              </Button>
            </View>
            {error && <Toast kind="error" message={error} />}
          </View>
        )}

        {part1Done && surveyStep === 2 && (
          <View className="px-container-padding gap-2 pt-6 border-t border-outline-warm mt-4">
            <Text className="font-body text-label-sm text-text-sub">2 / 2</Text>
            <Text className="font-heading text-headline-md text-text-pri">
              실제로 결제하셨다면 만족하셨을까요?
            </Text>
            <StarRow value={intentScore} onChange={setIntentScore} />
            <View className="mt-4">
              <Button onPress={handleStep2Submit} disabled={intentScore === 0}>
                응답 제출
              </Button>
            </View>
            {error && <Toast kind="error" message={error} />}
          </View>
        )}

        {part1Done && surveyStep === 3 && (
          <View className="px-container-padding pt-6 border-t border-outline-warm mt-4">
            <Toast kind="success" message="응답 감사합니다. 진단이 도움 됐길 바라요." />
          </View>
        )}
      </ScrollView>

      {surveyStep === 3 && (
        <StickyCTA>
          <Button onPress={() => router.replace('/')}>진단 종료</Button>
        </StickyCTA>
      )}
    </View>
  );
}
