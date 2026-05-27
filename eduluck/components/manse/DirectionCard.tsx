// 진로 방향성 — V15 (2026-05-27) 명명 통일:
//   - 주력 방향성 (11 directions) — 사회적 본업·전공의 큰 흐름
//   - 적성 점수 (5 scores: arts·medical·abroad·publicForce·research) — 개인 재능·기질 세부 신호
//   - 대운 발현 시기 라벨 — 청년기 흐름 (조숙·정석·전환·대기만성)
//   - 가치(자율선택) 메모 — footer 한 줄
//
// 디자인 위계 (NN/g progressive disclosure + 16Personalities 패턴):
//   1. 주력 방향성 = 큰 카드 (Hero, 별점 5점)
//   2. 적성 점수 = 작은 chip 행 (보조)
//   3. 대운 라벨 = 한 줄 inline
//   4. 가치 메모 = footer (회색)

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import type { DirectionEntry, DirectionLevel as CategoryLevel } from '@/lib/direction-system';
import type { ManseResult } from '@/lib/manse/engine';

interface Props {
  manse: ManseResult;
  /** compact=true: 한 줄 요약 + 펼침 (default). false: 전체 카드 */
  compact?: boolean;
}

const STAR_GOLD = '#F59E0B';
const MINT = '#10B981';

function StrengthDots({ level }: { level: CategoryLevel }) {
  const n = level === '매우 강' ? 5 : level === '강' ? 4 : level === '보통' ? 3 : 1;
  return (
    <Text className="font-body text-body-md" style={{ color: STAR_GOLD, letterSpacing: 2 }}>
      {'●'.repeat(n)}{'○'.repeat(5 - n)}
    </Text>
  );
}

/** 적성 점수 5종 chip — normalized 0-100 + 통일 레벨 */
interface AptitudeChipData {
  key: string;
  emoji: string;
  label: string;
  normalized: number;
  level: '약' | '보통' | '강' | '매우 강';
}

function aptitudeChipColor(level: AptitudeChipData['level']): { bg: string; border: string; text: string } {
  if (level === '매우 강') return { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900' };
  if (level === '강') return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' };
  if (level === '보통') return { bg: 'bg-surface-container-low', border: 'border-outline-warm', text: 'text-text-pri' };
  return { bg: 'bg-surface', border: 'border-outline-warm', text: 'text-text-sub' };
}

function AptitudeChip({ chip }: { chip: AptitudeChipData }) {
  const c = aptitudeChipColor(chip.level);
  return (
    <View
      className={`px-3 py-1.5 rounded-full border ${c.bg} ${c.border}`}
      accessibilityLabel={`적성 ${chip.label} ${chip.normalized}점 ${chip.level}`}
    >
      <Text className={`font-body text-label-md ${c.text}`}>
        {chip.emoji} {chip.label} {chip.normalized}
      </Text>
    </View>
  );
}

export function DirectionCard({ manse, compact = true }: Props) {
  const directions = manse.directions;
  const [activeKey, setActiveKey] = useState<DirectionEntry['key'] | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const strong = directions.filter(d => d.level === '매우 강' || d.level === '강');
  const mid = directions.filter(d => d.level === '보통');

  const strongDisplay = strong.length > 0 ? strong : mid;
  const midDisplay = strong.length > 0 ? mid : [];
  const isVersatile = strongDisplay.length >= 4;
  const strongHeaderLabel = isVersatile
    ? `🌟 주력 방향성 — 다재다능 (${strongDisplay.length})`
    : `🌟 주력 방향성 (${strongDisplay.length})`;

  const active = activeKey ? directions.find(d => d.key === activeKey) ?? null : null;

  // === 적성 점수 5종 chip 데이터 ===
  const aptitudes: AptitudeChipData[] = [
    { key: 'arts', emoji: '🎨', label: '예술', normalized: manse.artsScore.normalized, level: manse.artsScore.normalizedLevel },
    { key: 'medical', emoji: '💉', label: '의약', normalized: manse.medicalScore.normalized, level: manse.medicalScore.normalizedLevel },
    { key: 'abroad', emoji: '✈️', label: '해외', normalized: manse.abroadScore.normalized, level: manse.abroadScore.normalizedLevel },
    { key: 'publicForce', emoji: '🛡️', label: '사관', normalized: manse.publicForceScore.normalized, level: manse.publicForceScore.normalizedLevel },
    { key: 'research', emoji: '🔬', label: '연구', normalized: manse.researchScore.normalized, level: manse.researchScore.normalizedLevel },
  ];
  // 강·매우 강 먼저 정렬
  aptitudes.sort((a, b) => b.normalized - a.normalized);

  // === 대운 라벨 ===
  const dw = manse.daewoonLabel;
  const dwTypeLabel = dw.type === 'early' ? '조숙형' : dw.type === 'steady' ? '정석형' : dw.type === 'shift' ? '전환형' : '대기만성형';

  const renderDirectionCell = (d: DirectionEntry, isStrong: boolean) => (
    <Pressable
      key={d.key}
      onPress={() => setActiveKey(d.key)}
      accessibilityRole="button"
      accessibilityLabel={`${d.label} 방향성 ${d.level}. 자세히 보기`}
      className={`p-card-padding rounded-md border border-outline-warm gap-1 ${isStrong ? 'bg-surface-container-low' : 'bg-surface'}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className="flex-row items-center justify-between">
        <Text className={`font-body${isStrong ? '-bold' : ''} text-body-md ${isStrong ? 'text-text-pri' : 'text-text-sub'} flex-1`} numberOfLines={1}>
          {d.emoji} {d.label}
        </Text>
        <StrengthDots level={d.level} />
      </View>
      {isStrong && d.recommendedFields.length > 0 && (
        <Text className="font-body text-label-sm text-text-sub mt-0.5" numberOfLines={1}>
          {d.recommendedFields.slice(0, 3).join(' · ')}
        </Text>
      )}
    </Pressable>
  );

  if (compact) {
    return (
      <View className="gap-3">
        {/* 헤더 */}
        <View>
          <View className="flex-row items-center justify-between">
            <Text className="font-heading-bold text-headline-md text-text-pri">
              🎯 사주가 가리키는 방향성
            </Text>
            <Pressable
              onPress={() => setInfoOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="방향성 점수에 대한 설명 보기"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="font-body text-body-md text-text-sub">ⓘ</Text>
            </Pressable>
          </View>
          <Text className="font-body text-label-sm text-text-sub mt-1">
            사주에서 잘 풀리는 방향이에요. 실제 진로는 흥미·노력과 함께 정해져요.
          </Text>
        </View>

        {/* === 주력 방향성 (Top Hero) === */}
        {strongDisplay.length > 0 && (
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-body-bold text-label-md text-text-sub">
                {strongHeaderLabel}
              </Text>
              <Text className="font-body text-label-sm text-text-sub">
                {isVersatile ? '여러 영역 골고루 강함' : '본업으로 흐를 가능성'}
              </Text>
            </View>
            {isVersatile && (
              <Text className="font-body text-label-sm text-text-sub leading-relaxed">
                💡 사주가 어느 한 방향으로 치우치지 않고 여러 영역에 골고루 강해요. 어디로 갈지는 흥미·환경·시기 운까지 함께 봐야 해요.
              </Text>
            )}
            {strongDisplay.map(d => renderDirectionCell(d, true))}
          </View>
        )}

        {/* 가능한 방향 — chip */}
        {midDisplay.length > 0 && (
          <View className="gap-1.5">
            <Text className="font-body text-label-md text-text-sub">
              ✏️ 가능한 방향
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {midDisplay.map(d => (
                <Pressable
                  key={d.key}
                  onPress={() => setActiveKey(d.key)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-warm"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="font-body text-label-md text-text-pri">{d.emoji} {d.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* === 적성 점수 5 chip — 신규 V15 === */}
        <View className="gap-1.5 pt-2 border-t border-outline-warm">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-body-bold text-label-md text-text-sub" style={{ color: MINT }}>
              🎁 적성 점수
            </Text>
            <Text className="font-body text-label-sm text-text-sub">
              개인 재능·세부 신호 (0-100)
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {aptitudes.map(a => (
              <AptitudeChip key={a.key} chip={a} />
            ))}
          </View>
        </View>

        {/* === 대운 발현 시기 라벨 === */}
        <View className="px-3 py-2 rounded-md bg-surface-container-low border border-outline-warm">
          <Text className="font-body text-label-sm text-text-sub">
            🕐 청년기 흐름: <Text className="font-body-bold text-text-pri">{dwTypeLabel}</Text> — {dw.label}
          </Text>
        </View>

        {/* === 가치(자율선택) footer 메모 === */}
        <Text className="font-body text-label-sm text-text-sub leading-relaxed mt-1">
          ⓘ 사주는 타고난 경향이에요. 본인의 의지·노력·환경·선택에 따라 다르게 발현될 수 있어요. 점수가 낮은 영역도 의식적 훈련으로 충분히 발달 가능해요.
        </Text>

        {/* 면책 모달 — 방향성 시스템 전체 설명 */}
        <Modal visible={infoOpen} onClose={() => setInfoOpen(false)}>
          <View className="gap-3">
            <Text className="font-heading-bold text-headline-md text-text-pri">
              방향성 점수에 대해
            </Text>
            <Text className="font-body text-body-md text-text-pri leading-relaxed">
              방향성은 두 차원으로 나눠서 봐요. <Text className="font-body-bold">주력 방향성(11개)</Text>은 사주가 가리키는 사회적 본업의 큰 흐름이에요. <Text className="font-body-bold">적성 점수(5개)</Text>는 개인 안의 세부 재능·기질 신호예요.
            </Text>
            <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm gap-1">
              <Text className="font-body text-body-md text-text-pri">
                · 두 차원이 일치하면 = 본업화 가능
              </Text>
              <Text className="font-body text-body-md text-text-pri">
                · 엇갈리면 = 적성은 부전공·취미·보조로 발현
              </Text>
              <Text className="font-body text-body-md text-text-pri">
                · "청년기 흐름"은 23-32세 대운 발현 시기 안내
              </Text>
            </View>
            <Text className="font-body text-body-sm text-text-sub leading-relaxed">
              명리학(자평명리 격국론 + Holland RIASEC) 기반으로 사주의 강점·기질을 분류했어요. 실제 진로 선택은 흥미·훈련량·시기 운까지 함께 봐야 해요.
            </Text>
            <Pressable
              onPress={() => setInfoOpen(false)}
              className="mt-2 py-3 rounded-md bg-primary items-center"
            >
              <Text className="font-body-bold text-body-md text-surface-container-low">닫기</Text>
            </Pressable>
          </View>
        </Modal>

        {/* 방향성별 상세 모달 */}
        <Modal visible={active !== null} onClose={() => setActiveKey(null)}>
          {active && (
            <View className="gap-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-heading-bold text-headline-md text-text-pri flex-1">
                  {active.emoji} {active.label}
                </Text>
                <StrengthDots level={active.level} />
              </View>
              <Text className="font-body text-body-md text-text-pri">
                강도: <Text className="font-body-bold">{active.level}</Text>
              </Text>
              {active.recommendedFields.length > 0 ? (
                <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm gap-1">
                  <Text className="font-body text-label-sm text-text-sub">잘 맞는 트랙</Text>
                  {active.recommendedFields.map(f => (
                    <Text key={f} className="font-body text-body-md text-text-pri">· {f}</Text>
                  ))}
                </View>
              ) : (
                <Text className="font-body text-body-sm text-text-sub leading-relaxed">
                  이 방향은 약한 편이에요. 다른 방향에서 빛나는 사주예요.
                </Text>
              )}
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

  // Full mode — 모든 카드 노출
  return (
    <View className="gap-3">
      <Text className="font-heading-bold text-headline-md text-text-pri">
        🎯 사주가 가리키는 방향성
      </Text>
      {directions.map(d => renderDirectionCell(d, d.level === '매우 강' || d.level === '강'))}
    </View>
  );
}
