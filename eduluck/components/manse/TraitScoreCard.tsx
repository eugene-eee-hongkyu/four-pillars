// 학운 8개 특성 점수 카드 — §0 직후 노출되는 시각 hook
// 어머니가 첫 30초 안에 자녀의 학운 본질을 점수로 직관 파악.
//
// 디자인 (사용자 제공 이미지 패턴):
//   - 2열 그리드 (모바일 360~430 dpi 적합)
//   - 박스마다: 라벨 / 큰 점수 / 상위 N% 배지
//   - 점수 70+ 강조 (빨강·굵게), 50~70 보통, 50- 회색
//   - 상위 5% 이내 ⭐ 마커

import { View, Text } from 'react-native';
import { TRAIT_LABELS, type StudentTraitsWithPercentile } from '@/lib/manse/student-traits';
import { colors } from '@/design-tokens/tokens';

interface Props {
  traits: StudentTraitsWithPercentile;
}

interface CellProps {
  label: string;
  score: number;
  percentile: number;
}

function scoreColor(score: number): string {
  if (score >= 70) return colors.fire;     // 진한 빨강·강조 (상위 시그너)
  if (score >= 50) return colors.textPri;
  return colors.textSub;
}

function badgeColor(percentile: number): { bg: string; fg: string } | null {
  if (percentile <= 10) return { bg: colors.secondaryContainer, fg: colors.primary };
  if (percentile <= 30) return { bg: colors.surface, fg: colors.textSub };
  return null;
}

function ScoreCell({ label, score, percentile }: CellProps) {
  const sColor = scoreColor(score);
  const badge = badgeColor(percentile);
  const isTopElite = percentile <= 5;

  return (
    <View className="flex-1 p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1">
      <Text className="font-body text-label-sm text-text-sub">{label}</Text>
      <View className="flex-row items-baseline gap-2 mt-1">
        <Text
          className="font-heading-bold text-display-sm"
          style={{ color: sColor }}
        >
          {score}
        </Text>
        {badge && (
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badge.bg }}
          >
            <Text
              className="font-body-bold text-label-sm"
              style={{ color: badge.fg }}
            >
              {isTopElite ? '⭐ ' : ''}상위 {percentile}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function TraitScoreCard({ traits }: Props) {
  // raw 점수 높은 순으로 정렬해 강한 시그너부터 보이게
  const entries = (Object.keys(traits) as (keyof StudentTraitsWithPercentile)[])
    .map(k => ({
      key: k,
      label: TRAIT_LABELS[k],
      score: traits[k].normalized,
      percentile: traits[k].percentile,
    }))
    .sort((a, b) => a.percentile - b.percentile); // 상위 % 작은 순 (= 강한 순)

  // 2열 그리드로 배치
  const rows: typeof entries[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push(entries.slice(i, i + 2));
  }

  return (
    <View className="gap-3">
      <Text className="font-heading-bold text-headline-md text-text-pri">
        타고난 학운 8가지
      </Text>
      <Text className="font-body text-body-md text-text-sub">
        사주에서 계산된 강·약 본질이에요. 상위 % 는 같은 사주 시점 또래 기준이에요.
      </Text>
      <View className="gap-2 mt-2">
        {rows.map((row, ri) => (
          <View key={ri} className="flex-row gap-2">
            {row.map(e => (
              <ScoreCell key={e.key} label={e.label} score={e.score} percentile={e.percentile} />
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </View>
    </View>
  );
}
