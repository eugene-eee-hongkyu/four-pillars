// 사주팔자 4기둥 정통 명식판 — DESIGN v1.1 §5 단일 진실 (화면 4·10 동일)
// 일간 = secondary(골드) highlight. 정통 명리 항목 (십성·12운성·지장간·신살·공망) 노출.

import { View, Text } from 'react-native';
import { colors } from '@/design-tokens/tokens';

/** 4귀인 — 학운 핵심 신살은 골드 배지로 강조. */
const HAGUN_GUI = new Set(['문창귀인', '학당귀인', '문곡귀인', '천을귀인']);

export interface PalcaPillar {
  hanja: string;            // "戊辰"
  hangul: string;           // "무진"
  stemSipsin: string;       // "정관" or "(나)"
  branchSipsin: string;     // "편재"
  unsung: string;           // "관대"
  unsungStrength: 'strong' | 'weak' | 'mid';
  jijanggan: string[];      // ["을","계","무"]
  shensha: string[];        // ["화개살","공망"]
}

interface Props {
  yearPillar: PalcaPillar;
  monthPillar: PalcaPillar;
  dayPillar: PalcaPillar;
  hourPillar: PalcaPillar | null;
  /** 일주 highlight 표시. 기본 true. */
  highlightIlgan?: boolean;
}

interface PillarCellProps {
  pillar: PalcaPillar | null;
  label: string;           // '시' | '일' | '월' | '년'
  highlight: boolean;
}

function unsungColor(strength: PalcaPillar['unsungStrength']): string {
  if (strength === 'strong') return colors.primary;
  if (strength === 'weak') return colors.textSub;
  return colors.textPri;
}

function PillarCell({ pillar, label, highlight }: PillarCellProps) {
  if (!pillar) {
    // 시간 모름 — 미상 칸
    return (
      <View className="flex-1 items-center">
        <Text className="font-body text-label-sm text-text-sub mb-2">{label}</Text>
        <View className="items-center justify-center px-2 py-3 rounded-md w-full bg-surface-container-low">
          <Text className="font-hanja text-hanja-display text-text-sub">—</Text>
          <Text className="font-body text-label-sm text-text-sub mt-2">미상</Text>
        </View>
      </View>
    );
  }

  const stemHanja = pillar.hanja[0] ?? '—';
  const branchHanja = pillar.hanja[1] ?? '—';
  const stemHangul = pillar.hangul[0] ?? '';
  const branchHangul = pillar.hangul[1] ?? '';
  const isGongmang = pillar.shensha.includes('공망');

  return (
    <View className="flex-1 items-center">
      <Text className="font-body text-label-sm text-text-sub mb-1">{label}</Text>

      {/* 천간 십성 (위) */}
      <Text className="font-body text-label-sm text-text-sub h-4">
        {pillar.stemSipsin}
      </Text>

      <View
        className="items-center justify-center px-1 py-3 rounded-md w-full relative"
        style={highlight ? { backgroundColor: colors.secondaryContainer } : undefined}
      >
        {/* 공망 마크 우상단 */}
        {isGongmang && (
          <Text className="absolute top-1 right-1 font-body text-label-sm text-text-sub">◌</Text>
        )}

        {/* 천간 한자 + 한글 */}
        <Text
          className="font-hanja text-hanja-display"
          style={{ color: highlight ? colors.secondary : colors.primary }}
        >
          {stemHanja}
        </Text>
        <Text
          className="font-body text-label-sm"
          style={{ color: highlight ? colors.secondary : colors.textSub }}
        >
          {stemHangul}
        </Text>

        <View className="h-2" />

        {/* 지지 한자 + 한글 */}
        <Text
          className="font-hanja text-hanja-headline"
          style={{ color: highlight ? colors.secondary : colors.primary }}
        >
          {branchHanja}
        </Text>
        <Text
          className="font-body text-label-sm"
          style={{ color: highlight ? colors.secondary : colors.textSub }}
        >
          {branchHangul}
        </Text>
      </View>

      {/* 지지 십성 */}
      <Text className="font-body text-label-sm text-text-sub mt-1 h-4">
        {pillar.branchSipsin}
      </Text>

      {/* 12운성 — 강약 색상 */}
      <Text
        className="font-body text-label-sm mt-1"
        style={{ color: unsungColor(pillar.unsungStrength), fontWeight: pillar.unsungStrength === 'strong' ? '600' : '400' }}
      >
        {pillar.unsung}
      </Text>

      {/* 지장간 (가장 작게) */}
      <Text className="font-body text-text-sub mt-1" style={{ fontSize: 10 }}>
        {pillar.jijanggan.join('·') || '—'}
      </Text>

      {/* 신살 배지 — 공망 제외 (이미 ◌으로 표시). 4귀인은 골드 채움 + 볼드로 강조. */}
      <View className="flex-row flex-wrap justify-center gap-1 mt-2">
        {pillar.shensha
          .filter(s => s !== '공망')
          .map((s, i) => {
            const isGui = HAGUN_GUI.has(s);
            return (
              <View
                key={`${s}-${i}`}
                className="px-1.5 py-0.5 rounded"
                style={
                  isGui
                    ? { backgroundColor: colors.secondaryContainer, borderWidth: 1, borderColor: colors.secondary }
                    : { borderWidth: 1, borderColor: colors.outlineWarm }
                }
              >
                <Text
                  className={isGui ? 'font-body-bold' : 'font-body'}
                  style={{ fontSize: 11, color: isGui ? colors.secondary : colors.textSub, fontWeight: isGui ? '700' : '400' }}
                >
                  {s}
                </Text>
              </View>
            );
          })}
      </View>
    </View>
  );
}

export function PalcaTable({
  yearPillar,
  monthPillar,
  dayPillar,
  hourPillar,
  highlightIlgan = true,
}: Props) {
  return (
    <View
      className="flex-row gap-2 p-card-padding rounded-lg bg-surface-container-low border border-outline-warm"
    >
      <PillarCell pillar={hourPillar} label="시" highlight={false} />
      <PillarCell pillar={dayPillar} label="일" highlight={highlightIlgan} />
      <PillarCell pillar={monthPillar} label="월" highlight={false} />
      <PillarCell pillar={yearPillar} label="년" highlight={false} />
    </View>
  );
}
