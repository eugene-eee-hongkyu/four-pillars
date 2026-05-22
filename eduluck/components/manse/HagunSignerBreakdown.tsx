// 학운 종합 점수 분해 카드 — §0 학운 본질을 시그너 단위로 노출
//
// 명리 페르소나 + Agent 리서치 절충 (2026-05-22):
//   - 기본 화면: 정성 라벨 + 강도 ●○ (점수 숫자 비노출)
//   - 펼침: 정합성 보장 (시그너별 점수 + 합계 = 총점)
//   - 3그룹: 핵심 자리(≥+10) / 보강 자리(+5~9) / 보조 자리(+1~4)
//   - 페널티는 "보완할 자리" 별도 톤
//
// 명리 출처:
//   - 자평진전·적천수: 학운 평가는 정성적, 점수 가중치는 명리 전통 충돌
//   - 한국 운세 시장(포스텔러·점신·플러스운세력): 분해 UI 표준 ✗ — 점수와 텍스트 분리
//   - UX: 학부모는 "관인상생" 용어 모름, 수치 노출 시 혼란 위험

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ManseResult } from '@/lib/manse/engine';
import { computeHagun, scoreToGrade } from '@/lib/prompts/hagun-tier';

interface Props {
  manse: ManseResult;
}

/** 시그너 → 학부모 친화 설명 한 줄 매핑.
 *  명리 용어("관인상생")는 그대로 두되 1줄 해석을 붙여 학부모도 이해 가능. */
const SIGNER_EXPLAIN: Record<string, string> = {
  '관인상생+학자귀인 콤보': '학자형 사주의 최고 구조. 시험·자격에 직결.',
  '자립 학자형 콤보 (인성격+일지건록·제왕+비겁≥2)': '스스로 공부하는 자수성가형 학자 자리.',
  '학자형 양인 (양인+월지강+귀인≥2)': '추진력 강한 양인격이 학문으로 풀리는 자리.',
  '학자귀인 1개': '공부 길성(문창·학당·문곡)이 받쳐줘요.',
  '학자귀인 2개': '공부 길성이 2개. 시험·발표·연구에 강해요.',
  '천을귀인 1개': '하늘이 도와주는 최상귀. 어려울 때 풀려요.',
  '천을귀인 2개': '천을귀인이 두 자리. 인복이 매우 강해요.',
  '천덕+월덕 동시': '천우신조 팔자. 중요한 결정이 막힘없이 풀려요.',
  '천덕귀인': '하늘의 덕. 시험·결정에서 보조 길성.',
  '월덕귀인': '달의 덕. 안정·평온 보조.',
  '삼귀구비 (천을+천덕+월덕)': '천을+천덕+월덕 모두. 매우 희귀한 천우신조 구조.',
  '삼기귀인 (갑무경/을병정/임계신)': '비범한 두뇌. 명리 합의로 "삼기위귀(三奇爲貴)".',
  '청소년 대운 강': '16~22세 대운이 학문에 받쳐줘요.',
  '청소년 대운 보조': '16~22세 대운이 도와주는 흐름.',
  '청소년 대운 중립': '16~22세 대운이 안정적.',
  '신약 페널티': '일간이 약해 학문을 흡수하기 어려운 자리.',
  '신약 페널티 정인격 예외': '신약이지만 정인격이라 페널티가 작아요.',
  '재극인': '재성이 많아 학문 자리를 흔들 수 있어요.',
  '학자형 부재 (귀인0+격국✗+일지약)': '학자형 시그너가 부족한 자리.',
};

function explainSigner(name: string): string {
  // 정확 매칭 우선
  if (SIGNER_EXPLAIN[name]) return SIGNER_EXPLAIN[name];
  // 접두 매칭 (예: "학자형 격국 (정인격)" → "학자형 격국")
  if (name.startsWith('학자형 격국')) return '정인·편인·정관·식신·건록격 — 학자형 본질.';
  if (name.startsWith('인성 ')) return '학문의 뿌리. 정인·편인이 받쳐줘요.';
  if (name.startsWith('관성 ')) return '시험·체계·자격에 직결되는 자리.';
  if (name.startsWith('일주 통근')) return '일간이 본거지에 뿌리내린 자리. 그릇이 단단해요.';
  if (name.startsWith('청소년')) return '16~22세 대운 흐름.';
  if (name.includes('신약')) return '일간이 약한 자리. 인성격에서는 보완 가능.';
  return '명리 시그너.';
}

const STAR_GOLD = '#F59E0B';

function StrengthDots({ value }: { value: number }) {
  // 절댓값 기준: ≥15 ●●●●●, ≥10 ●●●●○, ≥7 ●●●○○, ≥4 ●●○○○, 그외 ●○○○○
  const a = Math.abs(value);
  const dots = a >= 15 ? 5 : a >= 10 ? 4 : a >= 7 ? 3 : a >= 4 ? 2 : 1;
  const color = value > 0 ? STAR_GOLD : '#94a3b8'; // 페널티는 회색
  return (
    <Text className="font-body text-body-md" style={{ color, letterSpacing: 2 }}>
      {'●'.repeat(dots)}{'○'.repeat(5 - dots)}
    </Text>
  );
}

export function HagunSignerBreakdown({ manse }: Props) {
  const [expanded, setExpanded] = useState(false);
  const breakdown = computeHagun(manse);
  const grade = scoreToGrade(breakdown.total);

  const positive = breakdown.hits.filter(h => h.value > 0).sort((a, b) => b.value - a.value);
  const negative = breakdown.hits.filter(h => h.value < 0);

  // 핵심 3 (최대 +값 3개)
  const top3 = positive.slice(0, 3);
  // 보강·보조 (나머지)
  const rest = positive.slice(3);

  return (
    <View className="gap-4">
      {/* 헤더 — 총점 + 등급 */}
      <View className="gap-1">
        <Text className="font-heading-bold text-headline-md text-text-pri">
          학운 종합 점수
        </Text>
        <View className="flex-row items-baseline gap-3 mt-1">
          <Text className="font-heading-bold text-display-sm" style={{ color: STAR_GOLD }}>
            {breakdown.total}
          </Text>
          <Text className="font-body text-body-md text-text-sub">/ 100</Text>
          <View className="px-2 py-0.5 rounded-full bg-secondary-container">
            <Text className="font-body-bold text-label-md text-primary">
              {grade.label} · {grade.baseTier}
            </Text>
          </View>
        </View>
        <Text className="font-body text-body-sm text-text-sub leading-relaxed mt-2">
          학교 티어 그릇 크기를 보여주는 점수예요. 아래는 이 점수를 만드는 사주 시그너들이에요.
        </Text>
      </View>

      {/* 핵심 3 자리 — 정성 강조 */}
      {top3.length > 0 && (
        <View className="gap-2">
          <Text className="font-heading-bold text-body-lg text-text-pri">
            ✨ 이 점수를 만드는 핵심 {top3.length}가지
          </Text>
          {top3.map((h, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            return (
              <View
                key={h.signer}
                className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-1"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-body-bold text-body-md text-text-pri flex-1">
                    {medal} {h.signer}
                  </Text>
                  <StrengthDots value={h.value} />
                </View>
                <Text className="font-body text-label-md text-text-sub leading-relaxed">
                  {explainSigner(h.signer)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* 함께 작용하는 자리 — 간략 키워드 */}
      {rest.length > 0 && (
        <View className="gap-1">
          <Text className="font-heading-bold text-body-md text-text-sub">
            🔹 함께 작용하는 자리 ({rest.length}개)
          </Text>
          <Text className="font-body text-body-sm text-text-pri leading-relaxed">
            {rest.map(h => h.signer).join(' · ')}
          </Text>
        </View>
      )}

      {/* 페널티 — "보완할 자리" 톤 */}
      {negative.length > 0 && (
        <View className="gap-2 p-card-padding rounded-md border border-outline-warm bg-surface">
          <Text className="font-heading-bold text-body-md text-text-sub">
            💤 보완할 자리 ({negative.length}개)
          </Text>
          <Text className="font-body text-body-sm text-text-sub leading-relaxed">
            {negative.map(h => h.signer).join(' · ')}
          </Text>
          <Text className="font-body text-label-sm text-text-sub">
            이 자리는 약해도 괜찮아요. 다른 시그너로 보강돼요.
          </Text>
        </View>
      )}

      {/* 펼침 — 정합성 보장 (분해 합 = 총점) */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        className="flex-row items-center justify-between px-3 py-2 rounded-md border border-outline-warm bg-surface"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="font-body text-label-md text-text-sub">
          🔍 점수 분해 자세히 보기
        </Text>
        <Text className="font-body text-label-md text-text-sub">{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View className="px-card-padding py-3 rounded-md bg-surface-container-low border border-outline-warm gap-2">
          {positive.length > 0 && (
            <>
              <Text className="font-body-bold text-label-sm text-text-sub">큰 자리 · 보조 자리</Text>
              {positive.map(h => (
                <View key={h.signer} className="flex-row justify-between">
                  <Text className="font-body text-body-sm text-text-pri flex-1">{h.signer}</Text>
                  <Text className="font-body-bold text-body-sm" style={{ color: STAR_GOLD }}>
                    +{h.value}
                  </Text>
                </View>
              ))}
            </>
          )}
          {negative.length > 0 && (
            <>
              <Text className="font-body-bold text-label-sm text-text-sub mt-2">보완할 자리</Text>
              {negative.map(h => (
                <View key={h.signer} className="flex-row justify-between">
                  <Text className="font-body text-body-sm text-text-sub flex-1">{h.signer}</Text>
                  <Text className="font-body-bold text-body-sm text-text-sub">{h.value}</Text>
                </View>
              ))}
            </>
          )}
          <View className="h-px bg-outline-warm my-2" />
          <View className="flex-row justify-between">
            <Text className="font-body-bold text-body-md text-text-pri">합계</Text>
            <Text className="font-heading-bold text-body-md" style={{ color: STAR_GOLD }}>
              {breakdown.total}점
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
