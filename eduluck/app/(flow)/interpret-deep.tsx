// v5 화면 13: 단일 섹션 Deep-dive 풀이 (5500~8000자)
// query: ?section=1~20

import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button } from '@/components/ui/Button';
import { StreamingBody } from '@/components/interpret/StreamingBody';
import { InterpretBody } from '@/components/interpret/InterpretBody';
import { DEEP_SECTIONS } from '@/lib/prompts/deep-sections';
import { useFlow } from '@/lib/flow/context';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { BirthSummary } from '@/components/manse/BirthSummary';

export default function InterpretDeep() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { state, setDeepDiveText } = useFlow();

  const section = useMemo(() => {
    const n = Number(params.section);
    return Number.isFinite(n) && DEEP_SECTIONS[n] ? n : null;
  }, [params.section]);

  const [done, setDone] = useState(false);

  // 다른 섹션으로 이동할 때 done 리셋
  useEffect(() => {
    setDone(false);
  }, [section]);

  if (!section) {
    return (
      <View className="flex-1 bg-surface p-card-padding gap-4">
        <Text className="font-heading text-headline-md text-text-pri">잘못된 섹션</Text>
        <Text className="font-body text-body-md text-text-sub">
          section 파라미터가 1~20 범위가 아니에요.
        </Text>
        <Button onPress={() => router.replace('/interpret-deep-select')}>섹션 선택으로</Button>
      </View>
    );
  }

  const spec = DEEP_SECTIONS[section];
  const cachedText = state.deepDiveTexts[section];
  const sessionReady = !!(state.sessionId && state.childSubjectId);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-6 pb-24 gap-4">
        {/* 상단 back link — 좌측 정렬 작은 ghost link (Notion·Linear 패턴) */}
        <View className="px-container-padding">
          <Pressable
            onPress={() => router.replace('/interpret-deep-select')}
            accessibilityRole="button"
            accessibilityLabel="영역 선택으로 돌아가기"
            className="self-start py-2 active:opacity-70"
          >
            <Text className="font-body text-label-sm text-text-sub">← 영역 선택</Text>
          </Pressable>
        </View>

        {/* 헤더 — 어느 섹션 deep-dive 중인지 명시 */}
        <View className="px-container-padding gap-1">
          <Text className="font-body text-label-sm text-text-sub">
            깊이 보기 · §{spec.number} {spec.group === 'Part1' ? 'Part 1' : 'Part 2'}
          </Text>
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            {spec.emoji} {headerShort(spec.header)}
          </Text>
          <Text className="font-body text-body-md text-text-sub">{spec.oneLine}</Text>
        </View>

        {/* 입력 정보 확인 — 다른 화면과 일관된 형식 */}
        <View className="px-container-padding">
          <BirthSummary
            child={state.child}
            mother={state.mother}
            motherStatus={state.motherStatus}
            father={state.father}
            fatherStatus={state.fatherStatus}
          />
        </View>

        {/* 본문 — 캐시 hit 또는 SSE 스트림 */}
        {cachedText ? (
          <View className="p-card-padding gap-4">
            <InterpretBody text={cachedText} />
          </View>
        ) : sessionReady ? (
          <StreamingBody
            endpoint="/api/interpret-deep"
            body={{
              sessionId: state.sessionId,
              childSubjectId: state.childSubjectId,
              motherSubjectId: state.motherSubjectId,
              fatherSubjectId: state.fatherSubjectId,
              section,
            }}
            stages={DEEP_STAGES}
            expectedDurationSec={60}
            onComplete={(text) => {
              setDeepDiveText(section, text);
              setDone(true);
            }}
          />
        ) : null}

        {/* 📝 피드백 CTA — 다른 영역 보기 위, 강조. 이미 제출한 sessionId 면 숨김. */}
        {(cachedText || done) && state.sessionId && !state.feedbackSubmittedSessions.includes(state.sessionId) && (
          <View className="px-container-padding mt-4">
            <Pressable
              onPress={() => {
                track(EVENTS.FEEDBACK_CTA_CLICK, { source: 'deep-dive' });
                router.push('/feedback?source=deep-dive' as never);
              }}
              className="px-card-padding py-5 rounded-md border-2 items-center gap-1"
              style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }}
            >
              <Text className="font-heading-bold text-headline-md text-text-pri text-center">
                📝 한 줄 피드백 부탁드려요 (3분)
              </Text>
              <Text className="font-body text-label-md text-text-sub text-center">
                어머님의 한 줄이 다음 진단을 더 정확하게 만듭니다
              </Text>
            </Pressable>
          </View>
        )}

        {/* 액션 — 다른 영역 보기 (forward only, back/home 은 헤더·상단 link 가 대신) */}
        {(cachedText || done) && (
          <View className="px-container-padding mt-4">
            <Button onPress={() => router.replace('/interpret-deep-select')}>
              📋 다른 영역 보기
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const DEEP_STAGES = [
  { at: 0, label: '사주·context 정리 중' },
  { at: 10, label: '명리 시그너 종합 풀이 중' },
  { at: 30, label: '학년대 액션·대안 정리 중' },
  { at: 50, label: '시그니처 마무리' },
];

function headerShort(header: string): string {
  const idx = header.indexOf(' — ');
  return idx >= 0 ? header.slice(0, idx) : header;
}
