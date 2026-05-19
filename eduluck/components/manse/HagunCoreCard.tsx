// 학운 3종 비중 카드 — 인성(印星)·관성(官星)·식상(食傷) 비중 막대 + 관인상생 진단.
// 학운 카드 4종 중 두 번째. 어머니가 즉시 "관인상생 = 학자 사주" 같은 핵심을 파악.

import { View, Text } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { colors } from '@/design-tokens/tokens';

interface Props {
  manse: ManseResult;
}

interface BarProps {
  label: string;
  hint: string;
  count: number;
  max: number;
  color: string;
}

function Bar({ label, hint, count, max, color }: BarProps) {
  const widthPct = max > 0 ? (count / max) * 100 : 0;
  const isAbsent = count === 0;
  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-body-bold text-label-md text-text-pri">{label}</Text>
          <Text className="font-body text-label-sm text-text-sub">{hint}</Text>
        </View>
        <Text className="font-body text-label-sm text-text-sub">
          {count}개{isAbsent ? ' · 보강 필요' : ''}
        </Text>
      </View>
      <View className="h-2 rounded-sm bg-surface-container-low overflow-hidden">
        <View
          style={{
            width: `${Math.max(widthPct, isAbsent ? 0 : 4)}%`,
            height: '100%',
            backgroundColor: isAbsent ? colors.outlineWarm : color,
          }}
        />
      </View>
    </View>
  );
}

export function HagunCoreCard({ manse }: Props) {
  const c = manse.sipsin.counts;
  const max = Math.max(c.insung, c.gwansung, c.siksang, 1);

  const diagnosis = manse.sipsin.isGwaninSangsaeng
    ? '관인상생(官印相生) — 시험·학문 모두에서 성취 가능한 학자 사주 구조.'
    : c.insung === 0
    ? '인성 보강 필요 — 학습 동기·문서·자격 인연을 환경으로 채워주는 것이 핵심.'
    : c.gwansung === 0
    ? '관성 보강 필요 — 시험·체계·마감 자기 통제를 환경으로 잡아주세요.'
    : c.siksang === 0
    ? '식상 보강 필요 — 표현·발표·창의를 풀어낼 자리를 만들어주세요.'
    : '인성·관성·식상 모두 갖춘 균형 명조 — 환경 설계만 받쳐주면 학운이 자연스럽게 열립니다.';

  return (
    <View className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-4">
      <Text className="font-body-bold text-label-sm text-text-sub">학운 핵심 — 인성·관성·식상 비중</Text>

      <View className="gap-3">
        <Bar label="인성(印星)" hint="학문·어머니·스승" count={c.insung} max={max} color="#9DBF8E" />
        <Bar label="관성(官星)" hint="시험·체계·합격" count={c.gwansung} max={max} color="#D98880" />
        <Bar label="식상(食傷)" hint="표현·발표·창의" count={c.siksang} max={max} color="#E5C07B" />
      </View>

      <View className="pt-2 border-t border-outline-warm">
        <Text className="font-body-bold text-label-sm text-text-sub mb-1">진단</Text>
        <Text className="font-body text-body-md text-text-pri">{diagnosis}</Text>
      </View>
    </View>
  );
}
