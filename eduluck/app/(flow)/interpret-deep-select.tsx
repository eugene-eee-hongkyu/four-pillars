// v5 화면 12: Deep-dive 섹션 선택 — 20개 카드 grid
// 어머니가 더 깊이 보고 싶은 영역을 1개 선택하면 interpret-deep로 push

import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button } from '@/components/ui/Button';
import { DEEP_SECTIONS } from '@/lib/prompts/interpret-deep';
import { useFlow } from '@/lib/flow/context';

export default function InterpretDeepSelect() {
  const router = useRouter();
  const { state } = useFlow();

  const sections = Object.values(DEEP_SECTIONS).sort((a, b) => a.number - b.number);
  const part1 = sections.filter(s => s.group === 'Part1');
  const part2 = sections.filter(s => s.group === 'Part2');

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="pt-8 pb-24 gap-6">
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
          onSelect={(n) => router.push({ pathname: '/interpret-deep', params: { section: String(n) } })}
          seenSections={Object.keys(state.deepDiveTexts).map(Number)}
        />
        <SectionGrid title="🔮 Part 2 · 학원·진로·미래" sections={part2}
          onSelect={(n) => router.push({ pathname: '/interpret-deep', params: { section: String(n) } })}
          seenSections={Object.keys(state.deepDiveTexts).map(Number)}
        />

        <View className="px-container-padding mt-4">
          <Button variant="ghost" onPress={() => router.back()}>← 정밀 진단으로 돌아가기</Button>
        </View>
      </ScrollView>
    </View>
  );
}

interface GridProps {
  title: string;
  sections: { number: number; header: string; oneLine: string; emoji: string }[];
  onSelect: (sectionNumber: number) => void;
  seenSections: number[];
}

function SectionGrid({ title, sections, onSelect, seenSections }: GridProps) {
  return (
    <View className="gap-3">
      <View className="px-container-padding">
        <Text className="font-body-bold text-label-md text-text-pri">{title}</Text>
      </View>
      <View className="px-container-padding gap-2">
        {sections.map((s) => {
          const seen = seenSections.includes(s.number);
          return (
            <Pressable
              key={s.number}
              accessibilityRole="button"
              accessibilityLabel={`${s.number}번 ${s.header} 깊이 보기`}
              onPress={() => onSelect(s.number)}
              className={`flex-row items-center gap-3 p-4 rounded-md border ${
                seen ? 'border-secondary bg-secondary-container/30' : 'border-outline-warm bg-surface-container-low'
              } active:opacity-70`}
            >
              <Text className="text-headline-md">{s.emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-label-md text-text-pri">
                  {s.number}. {headerShort(s.header)}
                </Text>
                <Text className="font-body text-label-sm text-text-sub">{s.oneLine}</Text>
              </View>
              {seen && (
                <Text className="font-body text-label-sm text-secondary">✓ 본 적 있음</Text>
              )}
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
