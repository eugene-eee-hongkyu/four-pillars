// 화면 11 ★: 정밀 진단 결과 + mom test 2차 + 결제 의향
// UX 옵션 B #9·#10 적용:
//  - 본문 위에 sticky mini TOC (4 섹션 anchor) — 긴 본문 navigation
//  - 별점 시점 분리 (step 1: 결제 가치 → 답변 → step 2: 결제 의향)

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { StickyCTA } from '@/components/ui/StickyCTA';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { ShareButton } from '@/components/interpret/ShareButton';
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

// 정밀 진단 16섹션 — skeleton에 미리 노출되는 구조 헤더 (StreamingBody A)
const PREMIUM_SECTION_HEADERS = [
  '1. 시작',
  '2. 본질',
  '3. 강점',
  '4. 약점·주의',
  '5. 환경 설계',
  '6. 훈육 가이드',
  '7. 친구·또래',
  '8. 학원·선생님',
  '9. 현재~앞으로의 흐름',
  '10. 국가·해외 운',
  '11. 직업·진로 흐름',
  '12. 전공 볼게요',
  '13. 학교 볼게요',
  '14. 가장 조심해야 하는 한 해',
  '15. 본질을 깨우는 가장 효과적 액션',
  '16. 어머니께 한 마디',
];

// 정밀 진단 ~45초 평균 — 시간 기반 단계 라벨 (StreamingBody C)
const PREMIUM_STAGES = [
  { at: 0, label: '사주 정리 중' },
  { at: 8, label: '본질·강점 풀이 중' },
  { at: 18, label: '환경·훈육 가이드 정리 중' },
  { at: 28, label: '운기·진로 흐름 풀이 중' },
  { at: 38, label: '학교·종합 조언 마무리' },
];

// 진단 완료 후 본문 위 mini TOC (긴 본문 navigation)
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

  // 캐시 hit (prefetch 완료된 정밀 텍스트) — streamDone 즉시 true로 → 본문 위 TOC + survey CTA 표시
  useEffect(() => {
    if (state.premiumInterpretText && !streamDone) {
      setStreamDone(true);
    }
  }, [state.premiumInterpretText, streamDone]);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-32 gap-6">
        <View className="px-container-padding gap-2">
          <StepIndicator current={5} />
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {state.child.nickname || '아이'}의 정밀 학운
          </Text>
        </View>

        {/* Hero — 학운 그릇 compact (첫 viewport에 결론 압축 — Agent UX 리서치 권장 B+F).
            등급·티어 + 게이지 + 핵심 시그너 chip 3개 + "근거 보기 ▾" 펼침 */}
        {state.childManse && (
          <View className="px-container-padding">
            <HagunSignerBreakdown manse={state.childManse} compact={true} />
          </View>
        )}

        {/* mini TOC — 진단 완료 후 본문 위 navigation (긴 본문 스캔) */}
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

        {/* LLM 본문 — Hero 직후 즉시 노출. 학부모는 등급 보고 바로 본문으로 진입.
            cache 효과로 사용자 wait 0초 — mom test perception 가장 큰 개선 포인트. */}
        {state.premiumInterpretText ? (
          <View className="p-card-padding gap-4">
            <InterpretBody text={state.premiumInterpretText} />
          </View>
        ) : state.sessionId && state.childSubjectId ? (
          <StreamingBody
            endpoint="/api/interpret-premium"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
              fatherSubjectId: state.fatherSubjectId,
            }}
            sectionHeaders={PREMIUM_SECTION_HEADERS}
            stages={PREMIUM_STAGES}
            expectedDurationSec={45}
            onComplete={(text) => { setPremiumInterpretText(text); setStreamDone(true); }}
          />
        ) : null}

        {/* 진로 방향성 8가지 — 본문 후 노출. 학자/의약/법조/이공/경영/사업/예술/체육 카테고리 */}
        {streamDone && state.childManse?.directions && (
          <View className="px-container-padding">
            <DirectionCard directions={state.childManse.directions} compact={true} />
          </View>
        )}

        {/* 학습 특성 4가지 — 공통 보조 (시험·끈기·자기주도·회복) */}
        {streamDone && state.childManse?.studentTraits && (
          <View className="px-container-padding">
            <TraitScoreCard traits={state.childManse.studentTraits} compact={true} />
          </View>
        )}

        {/* 공유 버튼 — streamDone 후 (캐시 hit 또는 stream 완료) */}
        {streamDone && state.sessionId && (
          <View className="px-container-padding mt-2">
            <ShareButton
              sessionId={state.sessionId}
              nickname={state.child.nickname || '아이'}
            />
          </View>
        )}

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
