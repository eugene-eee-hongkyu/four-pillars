// 화면 11 ★: 정밀 진단 결과 + mom test 2차 + 결제 의향
// UX 옵션 B #9·#10 적용:
//  - 본문 위에 sticky mini TOC (4 섹션 anchor) — 긴 본문 navigation
//  - 별점 시점 분리 (step 1: 결제 가치 → 답변 → step 2: 결제 의향)

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
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

const PREMIUM_LOADING = [
  '두 분의 사주를 함께 살펴보고 있어요...',
  '어머니-자녀 합 구조를 분석하는 중...',
  '학년별 가이드를 정리하는 중...',
  '합 시기와 운기 흐름을 풀어보는 중...',
  '종합 조언을 정리하는 중...',
  '곧 보여드릴게요...',
];

const SECTIONS = ['종합 분석', '학년대별 가이드', '어머니-자녀 합 시기', '종합 조언'];

export default function InterpretPremium() {
  const router = useRouter();
  const { state, setPremiumInterpretText } = useFlow();
  const [streamDone, setStreamDone] = useState(false);
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

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-6">
        <View className="px-container-padding gap-2">
          <StepIndicator current={13} />
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 정밀 학운
          </Text>
        </View>

        {/* 진단 완료 후 — 본문 위 mini TOC (긴 본문 navigation) */}
        {streamDone && (
          <View className="px-container-padding">
            <View className="flex-row flex-wrap gap-2 p-3 bg-secondary-container/40 rounded-md border border-outline-warm">
              <Text className="font-body text-label-sm text-text-sub w-full mb-1">📑 진단 구성</Text>
              {SECTIONS.map((s) => (
                <View
                  key={s}
                  className="bg-surface-container-low px-3 py-1 rounded-full border border-outline-warm"
                >
                  <Text className="font-body text-label-sm text-text-pri">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {state.sessionId && state.childSubjectId ? (
          <StreamingBody
            endpoint="/api/interpret-premium"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
              fatherSubjectId: state.fatherSubjectId,
            }}
            skeletonLines={12}
            loadingMessages={PREMIUM_LOADING}
            onComplete={(text) => { setPremiumInterpretText(text); setStreamDone(true); }}
          />
        ) : null}

        {/* survey 시점 분리 — 한 단계씩 */}
        {streamDone && surveyStep === 0 && (
          <View className="px-container-padding pt-6 border-t border-outline-warm mt-4">
            <Text className="font-body text-body-md text-text-sub text-center mb-3">
              진단 다 보셨으면 짧은 응답 부탁드려요 (2가지)
            </Text>
            <Button onPress={handleStartSurvey}>응답 시작</Button>
          </View>
        )}

        {streamDone && surveyStep === 1 && (
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

        {streamDone && surveyStep === 2 && (
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

        {streamDone && surveyStep === 3 && (
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
