// 진로 방향성 8개 카드 — 학자·연구 / 의약·치 / 법조·관료 / 이공계·기술 /
//                          경영·실무 / 사업·자영업 / 예술·미디어 / 체육·군경·외과
//
// Agent UX 리서치 권장 (NN/g progressive disclosure + 16Personalities 패턴):
//   - Compact 모드 (default): 한 줄 요약 + 펼침 시 3그룹 카드
//   - 강한 방향 (매우 강·강): Top 2~3 강조 카드 + 트랙 매핑
//   - 가능한 방향 (보통): 키워드 목록
//   - 약한 방향: 회색 처리 (참고용)
//
// 명리 출처: KCI 명리 진로상담 + 자평진전 격국 통설 + 부산대 평생교육원

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import type { DirectionEntry, DirectionLevel as CategoryLevel } from '@/lib/direction-system';

interface Props {
  directions: DirectionEntry[];
  /** compact=true: 한 줄 요약 + 펼침 (default). false: 전체 3그룹 카드 */
  compact?: boolean;
}

const STAR_GOLD = '#F59E0B';

function StrengthDots({ level }: { level: CategoryLevel }) {
  const n = level === '매우 강' ? 5 : level === '강' ? 4 : level === '보통' ? 3 : 1;
  return (
    <Text className="font-body text-body-md" style={{ color: STAR_GOLD, letterSpacing: 2 }}>
      {'●'.repeat(n)}{'○'.repeat(5 - n)}
    </Text>
  );
}

function levelLabel(level: CategoryLevel): { tone: 'strong' | 'mid' | 'weak'; emoji: string } {
  if (level === '매우 강' || level === '강') return { tone: 'strong', emoji: '🌟' };
  if (level === '보통') return { tone: 'mid', emoji: '✏️' };
  return { tone: 'weak', emoji: '💤' };
}

export function DirectionCard({ directions, compact = true }: Props) {
  const [activeKey, setActiveKey] = useState<DirectionEntry['key'] | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const strong = directions.filter(d => d.level === '매우 강' || d.level === '강');
  const mid = directions.filter(d => d.level === '보통');
  const weak = directions.filter(d => d.level === '약');

  // 모든 sample에서 최소 1개는 "강한 방향"이 있도록 fallback: 강이 0이면 보통 최상위 2개를 강으로 승격 표시
  const strongDisplay = strong.length > 0 ? strong : mid.slice(0, 2);
  // fallback 시 strongDisplay에 쓰인 2개를 제외한 나머지 mid를 가능한 방향으로 표시 (10 카테고리 모두 보이게)
  const midDisplay = strong.length > 0 ? mid : mid.slice(2);

  const active = activeKey ? directions.find(d => d.key === activeKey) ?? null : null;

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
        {/* 헤더 — 펼침 제거, 항상 즉시 노출 (피드백 #1: Hero급 결론은 펼침 ✗) */}
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

        {/* 강한 방향 — Filled card (primary) */}
        {strongDisplay.length > 0 && (
          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-body-bold text-label-md text-text-sub">
                🌟 강한 방향 ({strongDisplay.length})
              </Text>
              <Text className="font-body text-label-sm text-text-sub">사주가 받쳐주는 트랙</Text>
            </View>
            {strongDisplay.map(d => renderDirectionCell(d, true))}
          </View>
        )}

        {/* 가능한 방향 — Chip tag (secondary). strong이 0이면 strongDisplay에 쓰인 2개 제외한 나머지 */}
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

        {/* 약한 방향 — Chip tag (회색·작게, "참고" 라벨로 리프레이밍, negativity bias 완충) */}
        {weak.length > 0 && (
          <View className="gap-1">
            <Text className="font-body text-label-sm text-text-sub">
              참고: 약한 방향
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {weak.map(d => (
                <View key={d.key} className="px-2 py-1 rounded-full bg-surface border border-outline-warm">
                  <Text className="font-body text-label-sm text-text-sub" numberOfLines={1}>
                    {d.emoji} {d.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="font-body text-label-sm text-text-sub leading-relaxed mt-0.5">
              사주는 위 강한 방향에서 빛나요.
            </Text>
          </View>
        )}

        {/* 면책 모달 — 방향성 시스템 전체 설명 */}
        <Modal visible={infoOpen} onClose={() => setInfoOpen(false)}>
          <View className="gap-3">
            <Text className="font-heading-bold text-headline-md text-text-pri">
              방향성 점수에 대해
            </Text>
            <Text className="font-body text-body-md text-text-pri leading-relaxed">
              이 10개 방향은 명리학(자평명리 격국론 + 김기승 명리직업상담론 + Holland RIASEC 진로흥미 융합) 관점에서 사주의 강점·기질을 분류한 것이에요.
            </Text>
            <View className="px-3 py-2 rounded-md bg-surface border border-outline-warm gap-1">
              <Text className="font-body text-body-md text-text-pri">
                · "강한 방향" = 사주가 받쳐주는 트랙
              </Text>
              <Text className="font-body text-body-md text-text-pri">
                · "약한 방향" = 사주 신호가 적은 트랙 (능력 부족 아님)
              </Text>
              <Text className="font-body text-body-md text-text-pri">
                · 같은 사람이 보통 강한 방향 1-3개 + 가능한 방향 2-3개를 가져요
              </Text>
            </View>
            <Text className="font-body text-body-sm text-text-sub leading-relaxed">
              실제 진로 선택은 흥미·훈련량·시기 운까지 함께 봐야 해요. 명리 결과는 "여기서 시작해볼래?"라는 출발점이지 "정답"이 아니에요.
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

  // Full mode — 모든 8개 카드 노출 (확장 디버그·관리자용)
  return (
    <View className="gap-3">
      <Text className="font-heading-bold text-headline-md text-text-pri">
        🎯 사주가 가리키는 방향성 8가지
      </Text>
      {directions.map(d => renderDirectionCell(d, d.level === '매우 강' || d.level === '강'))}
    </View>
  );
}
