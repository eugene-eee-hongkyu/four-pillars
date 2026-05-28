// 피드백 폼 — mom test 11문항 (정량 6 + 정성 5)
// 진입: ?source=premium-part2 또는 ?source=deep-dive
// 제출: /api/feedback → feedback_responses 테이블 (sessionId·진단 메타 자동 첨부)

import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useFlow, PREMIUM_PROMPT_VERSION, getOrCreateDeviceId } from '@/lib/flow/context';
import { calculateFinalTierV2 } from '@/lib/prompts/hagun-tier';
import { track, EVENTS } from '@/lib/analytics/mixpanel';

type Score = 1 | 2 | 3 | 4 | 5 | null;

const QUANT_QUESTIONS: { key: string; q: string; sub?: string }[] = [
  { key: 'q2', q: '학운 그릇 라벨·점수 (예: "상위권 학업형 71/100")가 본인/자녀와 얼마나 일치하나요?' },
  { key: 'q3', q: '안정·가능·도전 학교가 실제 학력과 일치하나요?', sub: '성인은 본인 학교, 학생은 어머니 추측' },
  { key: 'q4', q: '주력 방향성 Top 3가 본인 직업·관심과 일치하나요?' },
  { key: 'q5', q: '적성 점수 중 강한 영역(의·약/예술/연구/공무/해외)이 본인과 맞나요?' },
  { key: 'q6', q: '본문 글이 읽기 쉬웠나요?' },
  { key: 'q7', q: '사주 진단을 믿을 만하다고 느끼셨나요?' },
];

const SCORE_LABELS = ['전혀', '아니', '보통', '맞아', '정확'];

function ScoreRow({ value, onChange }: { value: Score; onChange: (v: Score) => void }) {
  return (
    <View className="flex-row gap-2 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n as Score)}
          className={`flex-1 py-3 rounded-md border ${
            value === n
              ? 'bg-primary border-primary'
              : 'bg-surface-container-low border-outline-warm'
          }`}
        >
          <Text
            className={`font-body-bold text-body-md text-center ${
              value === n ? 'text-on-primary' : 'text-text-pri'
            }`}
          >
            {n}
          </Text>
          <Text
            className={`font-body text-label-sm text-center ${
              value === n ? 'text-on-primary' : 'text-text-sub'
            }`}
          >
            {SCORE_LABELS[n - 1]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function FeedbackForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { state, markFeedbackSubmitted } = useFlow();

  const source: 'premium-part2' | 'deep-dive' =
    params.source === 'deep-dive' ? 'deep-dive' : 'premium-part2';

  const tierInfo = useMemo(() => {
    if (!state.childManse) return null;
    return calculateFinalTierV2({
      childManse: state.childManse,
      motherManse: state.motherManse ?? null,
      fatherManse: state.fatherManse ?? null,
    });
  }, [state.childManse, state.motherManse, state.fatherManse]);

  const [scores, setScores] = useState<Record<string, Score>>({});
  const [q1, setQ1] = useState('');
  const [q8, setQ8] = useState('');
  const [q9, setQ9] = useState('');
  const [q10, setQ10] = useState('');
  const [q11, setQ11] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track(EVENTS.FEEDBACK_OPEN, { source });
  }, [source]);

  const setScore = (key: string, v: Score) =>
    setScores((s) => ({ ...s, [key]: v }));

  const handleSubmit = async () => {
    if (!state.sessionId) {
      setError('세션 정보가 없어요. 처음부터 다시 진단해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const gitSha = (process.env.EXPO_PUBLIC_GIT_SHA ?? '').slice(0, 7);
      const promptVersion = PREMIUM_PROMPT_VERSION;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          deviceId: getOrCreateDeviceId(),
          childSubjectId: state.childSubjectId,
          source,
          promptVersion,
          gitSha,
          grade: state.child.grade,
          gender: state.child.gender,
          hagunLabel: tierInfo?.hagunLabel ?? null,
          subTier: tierInfo?.subTier ?? null,
          q1FirstImpression: q1.trim() || null,
          q8FalseHopeOrDespair: q8.trim() || null,
          q9HelpfulSections: q9.trim() || null,
          q10MoreInfo: q10.trim() || null,
          q11WillingPrice: q11.trim() || null,
          q2HagunAccuracy: scores.q2,
          q3SchoolMatch: scores.q3,
          q4DirectionMatch: scores.q4,
          q5AptitudeMatch: scores.q5,
          q6Readability: scores.q6,
          q7Trust: scores.q7,
        }),
      });
      // 409 = UNIQUE (session_id, source) 위반 — 같은 진단의 같은 위치로 이미 제출. 친화 표시 + done=true.
      // edge case: cross-device 또는 localStorage 비움 후 같은 sessionId 로 재진입한 어머니.
      if (res.status === 409) {
        markFeedbackSubmitted(state.sessionId);
        setDone(true);
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      track(EVENTS.FEEDBACK_SUBMIT, {
        source,
        q_count_quant: Object.values(scores).filter((v) => v !== null && v !== undefined).length,
        q_count_text: [q1, q8, q9, q10, q11].filter((t) => t.trim()).length,
      });
      markFeedbackSubmitted(state.sessionId);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-container-padding">
        <Text className="font-heading-bold text-display-sm text-text-pri text-center">
          ✨ 피드백 감사합니다!
        </Text>
        <Text className="font-body text-body-md text-text-sub text-center mt-4 leading-relaxed">
          어머님의 한 줄이 진단 품질을 다음 단계로 끌어올립니다.{'\n'}
          소중한 시간 내주셔서 정말 감사해요.
        </Text>
        <View className="mt-8 gap-2 w-full max-w-sm">
          <Button onPress={() => router.replace('/')}>🏠 처음으로</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-container-padding pt-12 pb-32 gap-6 max-w-2xl self-center">
        <View className="gap-2">
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            📝 피드백 부탁드려요
          </Text>
          <Text className="font-body text-body-md text-text-sub leading-relaxed">
            3분이면 충분해요. 어머님의 한 줄이 다음 진단을 더 정확하게 만듭니다.{'\n'}
            모르겠는 문항은 건너뛰셔도 돼요.
          </Text>
        </View>

        {/* Q1 첫인상 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-lg text-text-pri">
            1. 진단을 보고 가장 먼저 든 느낌
          </Text>
          <Text className="font-body text-label-md text-text-sub">한 단어·한 줄 자유롭게</Text>
          <TextInput
            value={q1}
            onChangeText={setQ1}
            placeholder="예: 신기하다 / 헷갈린다 / 정확하다 / ..."
            placeholderTextColor="#9ca3af"
            className="border border-outline-warm rounded-md px-4 py-3 font-body text-body-md text-text-pri"
            multiline={false}
          />
        </View>

        {/* 정량 6문항 */}
        {QUANT_QUESTIONS.map((q, idx) => (
          <View key={q.key} className="gap-1">
            <Text className="font-body-bold text-body-lg text-text-pri">
              {idx + 2}. {q.q}
            </Text>
            {q.sub && (
              <Text className="font-body text-label-md text-text-sub">{q.sub}</Text>
            )}
            <ScoreRow value={scores[q.key] ?? null} onChange={(v) => setScore(q.key, v)} />
          </View>
        ))}

        {/* Q8 거짓 희망/절망 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-lg text-text-pri">
            8. 너무 좋게 (또는 너무 나쁘게) 말한 부분이 있다면?
          </Text>
          <Text className="font-body text-label-md text-text-sub">한 줄 자유 (없으면 건너뛰기)</Text>
          <TextInput
            value={q8}
            onChangeText={setQ8}
            placeholder="예: ○○ 부분이 좀 과해 보였어요 / 너무 약하게 말했어요"
            placeholderTextColor="#9ca3af"
            className="border border-outline-warm rounded-md px-4 py-3 font-body text-body-md text-text-pri min-h-[80px]"
            multiline
          />
        </View>

        {/* Q9 도움된 섹션 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-lg text-text-pri">
            9. 가장 도움되거나 기억나는 섹션
          </Text>
          <Text className="font-body text-label-md text-text-sub">
            예: 본질 / 강점 / 학교 / 진로 흐름 / 어머니께 한 마디 등 1~3개
          </Text>
          <TextInput
            value={q9}
            onChangeText={setQ9}
            placeholder="예: 학교 권유가 정확했어요. 어머니께 한 마디가 따뜻했어요."
            placeholderTextColor="#9ca3af"
            className="border border-outline-warm rounded-md px-4 py-3 font-body text-body-md text-text-pri min-h-[80px]"
            multiline
          />
        </View>

        {/* Q10 더 알고 싶은 영역 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-lg text-text-pri">
            10. 더 알고 싶거나 부족했던 영역
          </Text>
          <Text className="font-body text-label-md text-text-sub">
            예: 학원 추천 / 구체 시기 / 친구 관계 / ...
          </Text>
          <TextInput
            value={q10}
            onChangeText={setQ10}
            placeholder="예: 어떤 학원을 보내면 좋을지 더 알고 싶어요."
            placeholderTextColor="#9ca3af"
            className="border border-outline-warm rounded-md px-4 py-3 font-body text-body-md text-text-pri min-h-[80px]"
            multiline
          />
        </View>

        {/* Q11 결제 의향 */}
        <View className="gap-2">
          <Text className="font-body-bold text-body-lg text-text-pri">
            11. 친구에게 추천하신다면, 얼마면 결제하라고 하실까요?
          </Text>
          <Text className="font-body text-label-md text-text-sub">자유 (없으면 건너뛰기)</Text>
          <TextInput
            value={q11}
            onChangeText={setQ11}
            placeholder="예: 1~3만 원 / 잘 모르겠다 / 무료가 좋다"
            placeholderTextColor="#9ca3af"
            className="border border-outline-warm rounded-md px-4 py-3 font-body text-body-md text-text-pri"
            multiline={false}
          />
        </View>

        {error && (
          <Text className="font-body text-body-md text-error">{error}</Text>
        )}

        <View className="mt-4 gap-2">
          <Button onPress={handleSubmit} loading={submitting}>
            제출하기
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            나중에 하기
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
