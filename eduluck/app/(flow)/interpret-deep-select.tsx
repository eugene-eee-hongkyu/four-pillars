// v5 화면 12: Deep-dive 섹션 선택 — 14개 카드 grid
// 어머니가 더 깊이 보고 싶은 영역을 1개 선택하면 interpret-deep로 push
//
// Paywall 옵션 가: 첫 영역 무료 → 이미 1개 본 후 다른 영역 시도 시 비회원이면 로그인 강제.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PaywallModal } from '@/components/PaywallModal';
import { DEEP_SECTIONS } from '@/lib/prompts/interpret-deep';
import { useFlow } from '@/lib/flow/context';
import { useAuth } from '@/lib/hooks/useAuth';
import { isSectionCapReached } from '@/lib/paywall/policy';
import { track, EVENTS } from '@/lib/analytics/mixpanel';
import { useScrollToBottomOnRedirect } from '@/lib/hooks/useScrollToBottomOnRedirect';

export default function InterpretDeepSelect() {
  const router = useRouter();
  const { state } = useFlow();
  const { user } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToBottomOnRedirect(scrollRef);

  const sections = Object.values(DEEP_SECTIONS).sort((a, b) => a.number - b.number);
  const part1 = sections.filter(s => s.group === 'Part1');
  const part2 = sections.filter(s => s.group === 'Part2');
  const seenSections = Object.keys(state.deepDiveTexts).map(Number);
  // 트리거 2: 영역 cap 도달 시 paywall (비회원 1개, 회원 5개). 이미 본 영역은 캐시 hit 자유 진입.
  const sectionCapReached = isSectionCapReached(seenSections.length, !!user);

  // sessionId 단위 1회만 fire — Mixpanel funnel 정확도
  const capFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (sectionCapReached && state.sessionId && capFiredRef.current !== state.sessionId) {
      capFiredRef.current = state.sessionId;
      track(EVENTS.SECTION_CAP_REACHED, {
        seen_count: seenSections.length,
        member: !!user,
      });
    }
  }, [sectionCapReached, state.sessionId, seenSections.length, user]);

  const handleSelect = (n: number) => {
    // 이미 본 영역은 무료로 다시 보기 가능 (캐시 hit)
    const alreadySeen = seenSections.includes(n);
    if (!alreadySeen && sectionCapReached) {
      setPaywallOpen(true);
      return;
    }
    router.push({ pathname: '/interpret-deep', params: { section: String(n) } });
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView ref={scrollRef} contentContainerClassName="pt-6 pb-24 gap-6">
        {/* 상단 back link — 좌측 정렬 작은 ghost link (Notion·Linear 패턴) */}
        <View className="px-container-padding">
          <Pressable
            onPress={() => router.replace('/interpret-premium')}
            accessibilityRole="button"
            accessibilityLabel="정밀 진단으로 돌아가기"
            className="self-start py-2 active:opacity-70"
          >
            <Text className="font-body text-label-sm text-text-sub">← 정밀 진단으로</Text>
          </Pressable>
        </View>

        <View className="px-container-padding gap-2">
          <Text className="font-heading-bold text-headline-lg text-text-pri">
            📋 더 자세히 알고 싶은 영역
          </Text>
          <Text className="font-body text-body-md text-text-sub">
            카드 1개를 선택하면 그 영역만 깊이 풀어드려요 (~8000자, 약 1분).
            여러 영역도 차례대로 볼 수 있어요.
          </Text>
        </View>

        <SectionGrid title="📖 Part 1 · 본질·관계·즉시 행동" sections={part1}
          onSelect={handleSelect}
          seenSections={seenSections}
          lockedForNew={sectionCapReached}
        />
        <SectionGrid title="🔮 Part 2 · 학원·진로·미래" sections={part2}
          onSelect={handleSelect}
          seenSections={seenSections}
          lockedForNew={sectionCapReached}
        />

        <PaywallModal
          visible={paywallOpen}
          trigger="deepdive"
          isMember={!!user}
          onClose={() => setPaywallOpen(false)}
        />
      </ScrollView>
    </View>
  );
}

interface GridProps {
  title: string;
  sections: { number: number; header: string; oneLine: string; emoji: string }[];
  onSelect: (sectionNumber: number) => void;
  seenSections: number[];
  /** 비회원이 무료 1개를 이미 본 상태 — 새 영역은 잠금 표시. 캐시된 영역(seen)은 자유롭게 재진입. */
  lockedForNew: boolean;
}

function SectionGrid({ title, sections, onSelect, seenSections, lockedForNew }: GridProps) {
  return (
    <View className="gap-3">
      <View className="px-container-padding">
        <Text className="font-body-bold text-label-md text-text-pri">{title}</Text>
      </View>
      <View className="px-container-padding gap-2">
        {sections.map((s) => {
          const seen = seenSections.includes(s.number);
          const locked = lockedForNew && !seen;
          return (
            <Pressable
              key={s.number}
              accessibilityRole="button"
              accessibilityLabel={`${s.number}번 ${s.header} ${locked ? '로그인 후 보기' : '깊이 보기'}`}
              onPress={() => onSelect(s.number)}
              className={`flex-row items-center gap-3 p-4 rounded-md border ${
                seen
                  ? 'border-secondary bg-secondary-container/30'
                  : locked
                    ? 'border-outline-warm bg-surface-container-low opacity-70'
                    : 'border-outline-warm bg-surface-container-low'
              } active:opacity-70`}
            >
              <Text className="text-headline-md">{s.emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-label-md text-text-pri">
                  {s.number}. {headerShort(s.header)}
                </Text>
                <Text className="font-body text-label-sm text-text-sub">{s.oneLine}</Text>
              </View>
              {seen ? (
                <Text className="font-body text-label-sm text-secondary">✓ 본 적 있음</Text>
              ) : locked ? (
                <Text className="font-body text-label-sm text-text-sub">🔒</Text>
              ) : null}
              <Text className="font-body text-label-md text-text-sub">›</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** "시작 — 인사·이름·전체 그림" 같은 헤더에서 em dash 앞부분만 추출 */
function headerShort(header: string): string {
  const idx = header.indexOf(' — ');
  return idx >= 0 ? header.slice(0, idx) : header;
}
