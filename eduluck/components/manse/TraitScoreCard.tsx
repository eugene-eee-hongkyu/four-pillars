// 학운 10개 특성 점수 카드 — §0 직후 노출되는 시각 hook
// 어머니가 첫 30초 안에 자녀의 학운 본질을 점수로 직관 파악.
//
// 디자인 (UX 페르소나 검토):
//   - 2열 그리드 (모바일 360~430 dpi 적합)
//   - 박스마다: 라벨 / 큰 점수 / 상위 N% 배지 / ⓘ 정보 아이콘 (NN/g 정보 시그너)
//   - 점수 70+ 강조 (빨강·굵게), 50~70 보통, 50- 회색
//   - 카드 전체 tappable → 모달로 어머니 친화 설명 노출
//   - 상위 5% 이내 ⭐ 마커
//   - first-time hint (1회성) — localStorage 기반

import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import {
  TRAIT_LABELS, TRAIT_DESCRIPTIONS,
  type StudentTraits, type StudentTraitsWithPercentile,
} from '@/lib/manse/student-traits';
import { colors } from '@/design-tokens/tokens';

interface Props {
  traits: StudentTraitsWithPercentile;
}

interface CellProps {
  traitKey: keyof StudentTraits;
  label: string;
  score: number;
  percentile: number;
  onPress: () => void;
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

function ScoreCell({ label, score, percentile, onPress }: CellProps) {
  const sColor = scoreColor(score);
  const badge = badgeColor(percentile);
  const isTopElite = percentile <= 5;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${score}점, 상위 ${percentile}%. 자세한 설명 보기`}
      className="flex-1 p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-body text-label-sm text-text-sub flex-1">{label}</Text>
        <Text className="font-body text-label-sm text-text-sub ml-1">ⓘ</Text>
      </View>
      <View className="flex-row items-baseline gap-2 mt-1">
        <Text className="font-heading-bold text-display-sm" style={{ color: sColor }}>
          {score}
        </Text>
        {badge && (
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg }}>
            <Text className="font-body-bold text-label-sm" style={{ color: badge.fg }}>
              {isTopElite ? '⭐ ' : ''}상위 {percentile}%
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const HINT_STORAGE_KEY = 'eduluck:trait-hint-seen';

export function TraitScoreCard({ traits }: Props) {
  const [activeKey, setActiveKey] = useState<keyof StudentTraits | null>(null);
  const [showHint, setShowHint] = useState(false);

  // first-time hint (1회성, localStorage)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const seen = window.localStorage.getItem(HINT_STORAGE_KEY);
      if (!seen) setShowHint(true);
    } catch {}
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try { window.localStorage?.setItem(HINT_STORAGE_KEY, '1'); } catch {}
  };

  // raw 점수 높은 순으로 정렬해 강한 시그너부터 보이게
  const entries = (Object.keys(traits) as (keyof StudentTraitsWithPercentile)[])
    .map(k => ({
      key: k,
      label: TRAIT_LABELS[k],
      score: traits[k].normalized,
      percentile: traits[k].percentile,
    }))
    .sort((a, b) => a.percentile - b.percentile);

  // 2열 그리드
  const rows: typeof entries[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push(entries.slice(i, i + 2));
  }

  const active = activeKey ? {
    label: TRAIT_LABELS[activeKey],
    desc: TRAIT_DESCRIPTIONS[activeKey],
    score: traits[activeKey].normalized,
    percentile: traits[activeKey].percentile,
  } : null;

  return (
    <View className="gap-3">
      <Text className="font-heading-bold text-headline-md text-text-pri">
        타고난 학운 10가지
      </Text>
      <Text className="font-body text-body-md text-text-sub">
        사주에서 계산된 강·약 본질이에요. 상위 % 는 같은 사주 시점 또래 기준이에요.
      </Text>

      {/* 첫 진입 hint — 1회성 */}
      {showHint && (
        <Pressable
          onPress={dismissHint}
          className="flex-row items-center justify-between px-3 py-2 rounded-md bg-secondary-container border border-outline-warm"
        >
          <Text className="font-body text-label-md text-text-pri flex-1">
            💡 카드를 누르면 자세한 설명이 나와요
          </Text>
          <Text className="font-body text-label-sm text-text-sub ml-2">✕</Text>
        </Pressable>
      )}

      <View className="gap-2 mt-1">
        {rows.map((row, ri) => (
          <View key={ri} className="flex-row gap-2">
            {row.map(e => (
              <ScoreCell
                key={e.key}
                traitKey={e.key}
                label={e.label}
                score={e.score}
                percentile={e.percentile}
                onPress={() => setActiveKey(e.key)}
              />
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </View>

      {/* 항목별 상세 설명 모달 */}
      <Modal visible={active !== null} onClose={() => setActiveKey(null)}>
        {active && (
          <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-heading-bold text-headline-md text-text-pri">{active.label}</Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="font-heading-bold text-headline-lg" style={{ color: scoreColor(active.score) }}>
                  {active.score}
                </Text>
                <Text className="font-body text-label-md text-text-sub">상위 {active.percentile}%</Text>
              </View>
            </View>
            <Text className="font-body text-body-md text-text-pri leading-relaxed">
              {active.desc.what}
            </Text>
            <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm">
              <Text className="font-body text-label-sm text-text-sub mb-1">잘 맞는 트랙</Text>
              <Text className="font-body-bold text-body-md text-text-pri">{active.desc.fits}</Text>
            </View>
            <Pressable
              onPress={() => setActiveKey(null)}
              className="mt-2 py-3 rounded-md bg-primary items-center"
            >
              <Text className="font-body-bold text-body-md text-surface-container-low">닫기</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}
