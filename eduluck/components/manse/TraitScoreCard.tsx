// 학운 10개 특성 카드 — §0 직후 노출되는 시각 hook (v4: 별점·그룹 분류)
// 어머니가 첫 30초 안에 자녀의 학과·트랙 방향성을 직관 파악.
//
// 디자인 변경 (v3 → v4, 2026-05-22):
//   ❌ 점수 0~100 + 상위 N% 배지 (티어·서열 느낌 + 비교 강요)
//   ✅ 별 1~5개 + 그룹 분류 (타고난 자리 / 보통 자리 / 약한 자리)
//   ✅ 약한 자리에 "다른 트랙에서 빛나요" 메시지
//   ✅ 카드 안에 트랙 매핑 직접 노출 (fits)
//   → 명리 합의 정합: "내 아이의 고유 그릇" — 비교 ✗, 자기 자리

import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import {
  TRAIT_LABELS, TRAIT_DESCRIPTIONS,
  type StudentTraits, type StudentTraitsWithPercentile,
} from '@/lib/manse/student-traits';

interface Props {
  traits: StudentTraitsWithPercentile;
  /** compact=true: 한 줄 요약 + 펼침 (본문 안 inline). default false: 전체 3그룹 카드 노출 */
  compact?: boolean;
}

/** percentile (낮을수록 상위) → 별 개수 1~5
 *  113,976 sample 분포 기반 */
function starsFromPercentile(percentile: number): number {
  if (percentile <= 5) return 5;   // 상위 5%
  if (percentile <= 20) return 4;  // 상위 20%
  if (percentile <= 50) return 3;  // 상위 50% (평균 이상)
  if (percentile <= 75) return 2;  // 상위 75% (평균 이하)
  return 1;                         // 하위 25%
}

/** 별 개수 → 그룹.
 *  학부모가 "타고난 자리 0개"를 보지 않도록 ★3 = 타고난 자리.
 *  대부분의 사주에서 ★3 이상이 2~4개 나옴 — 강한 자리만 노출. */
function groupFromStars(stars: number): 'gifted' | 'normal' | 'weak' {
  if (stars >= 3) return 'gifted';  // 타고난 자리 (★3~5)
  if (stars === 2) return 'normal'; // 보통 자리 (★2)
  return 'weak';                     // 약한 자리 (★1)
}

/** 황금색 별 — 사용자 피드백 (2026-05-22): 빨강 ✗, 황금색 / 빈 별은 ☆ outline. */
const STAR_GOLD = '#F59E0B'; // amber-500 (가독성 좋은 황금색)

function StarRow({ stars }: { stars: number }) {
  return (
    <Text className="font-body text-body-md" style={{ color: STAR_GOLD, letterSpacing: 2 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </Text>
  );
}

interface CellProps {
  label: string;
  fits: string;
  stars: number;
  group: 'gifted' | 'normal' | 'weak';
  onPress: () => void;
}

function TraitCell({ label, fits, stars, group, onPress }: CellProps) {
  const isGifted = group === 'gifted';
  const isWeak = group === 'weak';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${stars}점 만점에 ${stars}점. ${fits}. 자세한 설명 보기`}
      className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : (isWeak ? 0.6 : 1) })}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className={`font-body${isGifted ? '-bold' : ''} text-body-md ${isWeak ? 'text-text-sub' : 'text-text-pri'} flex-1`}
        >
          {isGifted && '🌟 '}{label}
        </Text>
        <Text className="font-body text-label-sm text-text-sub ml-1">ⓘ</Text>
      </View>
      <StarRow stars={stars} />
      {!isWeak && (
        <Text className="font-body text-label-sm text-text-sub mt-0.5" numberOfLines={1}>
          {fits}
        </Text>
      )}
    </Pressable>
  );
}

const HINT_STORAGE_KEY = 'eduluck:trait-hint-seen-v4';

export function TraitScoreCard({ traits, compact = false }: Props) {
  const [activeKey, setActiveKey] = useState<keyof StudentTraits | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [compactExpanded, setCompactExpanded] = useState(false);

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

  // 10개 trait → 별점 + 그룹 분류
  const entries = (Object.keys(traits) as (keyof StudentTraitsWithPercentile)[])
    .map(k => {
      const stars = starsFromPercentile(traits[k].percentile);
      return {
        key: k,
        label: TRAIT_LABELS[k],
        fits: TRAIT_DESCRIPTIONS[k].fits,
        stars,
        group: groupFromStars(stars),
        percentile: traits[k].percentile,
      };
    })
    .sort((a, b) => a.percentile - b.percentile);

  const gifted = entries.filter(e => e.group === 'gifted');
  const normal = entries.filter(e => e.group === 'normal');
  const weak = entries.filter(e => e.group === 'weak');

  const renderGroup = (items: typeof entries) => {
    const rows: typeof entries[] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return (
      <View className="gap-2">
        {rows.map((row, ri) => (
          <View key={ri} className="flex-row gap-2">
            {row.map(e => (
              <View key={e.key} className="flex-1">
                <TraitCell
                  label={e.label}
                  fits={e.fits}
                  stars={e.stars}
                  group={e.group}
                  onPress={() => setActiveKey(e.key)}
                />
              </View>
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </View>
    );
  };

  const active = activeKey ? {
    label: TRAIT_LABELS[activeKey],
    desc: TRAIT_DESCRIPTIONS[activeKey],
    stars: starsFromPercentile(traits[activeKey].percentile),
    percentile: traits[activeKey].percentile,
  } : null;

  // ===== Compact 모드 — 본문 inline 인라인 사용용 =====
  //   한 줄 요약 (🌟 N · ✏️ N · 💤 N) + 펼침 시 전체 카드
  //   NN/g progressive disclosure + scroll fatigue 완화
  if (compact) {
    return (
      <View className="gap-2">
        <Pressable
          onPress={() => setCompactExpanded(!compactExpanded)}
          accessibilityRole="button"
          accessibilityLabel={`타고난 학운 10가지 — 타고난 ${gifted.length}, 보통 ${normal.length}, 약한 ${weak.length}. 자세히 보기`}
          className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-heading-bold text-body-lg text-text-pri">
              🎯 학과·트랙 방향성 10가지
            </Text>
            <Text className="font-body text-label-md text-text-sub">{compactExpanded ? '▴' : '▾'}</Text>
          </View>
          <Text className="font-body text-body-sm text-text-sub leading-relaxed">
            🌟 타고난 자리 <Text className="font-body-bold text-text-pri">{gifted.length}개</Text> · ✏️ 보통 <Text className="font-body-bold text-text-pri">{normal.length}개</Text> · 💤 약한 <Text className="font-body-bold text-text-sub">{weak.length}개</Text>
          </Text>
          {!compactExpanded && gifted.length > 0 && (
            <Text className="font-body text-label-sm text-text-sub mt-1" numberOfLines={1}>
              ★ {gifted.slice(0, 3).map(e => e.label).join(' · ')}{gifted.length > 3 ? ` 외 ${gifted.length - 3}` : ''}
            </Text>
          )}
        </Pressable>

        {compactExpanded && (
          <View className="gap-4">
            {gifted.length > 0 && (
              <View className="gap-2">
                <View className="flex-row items-baseline justify-between">
                  <Text className="font-heading-bold text-body-md text-text-pri">
                    🌟 타고난 자리 <Text className="font-body text-body-sm text-text-sub">({gifted.length}개)</Text>
                  </Text>
                </View>
                {renderGroup(gifted)}
              </View>
            )}
            {normal.length > 0 && (
              <View className="gap-2">
                <Text className="font-heading-bold text-body-md text-text-pri">
                  ✏️ 보통 자리 <Text className="font-body text-body-sm text-text-sub">({normal.length}개)</Text>
                </Text>
                {renderGroup(normal)}
              </View>
            )}
            {weak.length > 0 && (
              <View className="gap-2">
                <Text className="font-heading-bold text-body-md text-text-sub">
                  💤 약한 자리 <Text className="font-body text-body-sm text-text-sub">({weak.length}개)</Text>
                </Text>
                <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm">
                  <Text className="font-body text-label-md text-text-sub leading-relaxed">
                    이 자리는 약해도 괜찮아요. 사주가 <Text className="font-body-bold text-text-pri">다른 트랙</Text>으로 빛나는 자리예요.
                  </Text>
                </View>
                {renderGroup(weak)}
              </View>
            )}
          </View>
        )}

        {/* 항목별 상세 설명 모달 */}
        <Modal visible={active !== null} onClose={() => setActiveKey(null)}>
          {active && (
            <View className="gap-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-heading-bold text-headline-md text-text-pri flex-1">{active.label}</Text>
                <StarRow stars={active.stars} />
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

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="font-heading-bold text-headline-md text-text-pri">
          타고난 학운 10가지
        </Text>
        <Text className="font-body text-body-sm text-text-sub leading-relaxed">
          학교 티어가 <Text className="font-body-bold text-text-pri">그릇 크기</Text>라면, 이 10가지는 <Text className="font-body-bold text-text-pri">어떤 트랙·학과가 맞는지</Text> 보여줘요. 비교가 아니라 <Text className="font-body-bold text-text-pri">자기 자리를 찾는 지도</Text>예요. 강한 자리 2~3개만 잘 살려도 충분해요.
        </Text>
      </View>

      {/* 첫 진입 hint */}
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

      {/* 타고난 자리 */}
      {gifted.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-heading-bold text-body-lg text-text-pri">
              🌟 타고난 자리 <Text className="font-body text-body-md text-text-sub">({gifted.length}개)</Text>
            </Text>
            <Text className="font-body text-label-sm text-text-sub">사주가 받쳐주는 본질</Text>
          </View>
          {renderGroup(gifted)}
        </View>
      )}

      {/* 보통 자리 */}
      {normal.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-heading-bold text-body-lg text-text-pri">
              ✏️ 보통 자리 <Text className="font-body text-body-md text-text-sub">({normal.length}개)</Text>
            </Text>
            <Text className="font-body text-label-sm text-text-sub">길게 가는 데 도움</Text>
          </View>
          {renderGroup(normal)}
        </View>
      )}

      {/* 약한 자리 — 다른 트랙에서 빛나요 메시지 */}
      {weak.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-heading-bold text-body-lg text-text-sub">
              💤 약한 자리 <Text className="font-body text-body-md text-text-sub">({weak.length}개)</Text>
            </Text>
          </View>
          <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm">
            <Text className="font-body text-label-md text-text-sub leading-relaxed">
              이 자리는 약해도 괜찮아요. 사주가 <Text className="font-body-bold text-text-pri">다른 트랙</Text>으로 빛나는 자리예요. 모든 카드가 강할 필요는 없어요.
            </Text>
          </View>
          {renderGroup(weak)}
        </View>
      )}

      {/* 항목별 상세 설명 모달 */}
      <Modal visible={active !== null} onClose={() => setActiveKey(null)}>
        {active && (
          <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-heading-bold text-headline-md text-text-pri flex-1">{active.label}</Text>
              <StarRow stars={active.stars} />
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
