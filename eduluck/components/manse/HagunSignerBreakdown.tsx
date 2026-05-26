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

/** raw signer 라벨에서 영문 detector ID prefix 제거.
 *  - 'combo_xxx (한국어 라벨)' 형식 → '한국어 라벨' (괄호 안만)
 *  - 'combo_xxx' 같이 괄호 없는 영문 키 → SIGNER_LABELS dict lookup
 *  - 그 외(한글만) → 그대로
 *
 *  hagun-tier.ts signer 라벨은 calibration·self-test에서 detector ID로 쓰이므로
 *  변경 불가. UI 표시 단계에서만 사람 친화 한국어로 변환. */
const SIGNER_LABELS: Record<string, string> = {
  'combo_yanginScholar': '양인 학자형',
};

function displaySigner(raw: string): string {
  const m = raw.match(/\((.+?)\)\s*$/);
  if (m) return m[1].trim();
  if (/^[a-z_]+$/i.test(raw)) {
    return SIGNER_LABELS[raw] ?? raw;
  }
  return raw;
}

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

/** 등급 라벨 → 강도 게이지 (5단계).
 *  점수 숫자 비노출 + 게이지로 직관 표시. 학부모 인지 부조화 해소
 *  ("100점 만점 32점 = 낙제 vs 강 2~3티어 = 좋음" 충돌 제거). */
function gradeToGauge(label: string): number {
  switch (label) {
    case '매우 강': return 5;
    case '강': return 4;
    case '중상': return 3;
    case '중': return 2;
    case '중하': return 1;
    default: return 0; // 약상·약중·약하
  }
}

/** Hero — 사용자 피드백 반영 (2026-05-23):
 *   - 펼침 ✗ — 처음부터 다 보임 (hero인데 접어두면 안 됨)
 *   - 핵심 시그너 + 함께 작용 모두 박스 + 강도 점
 *   - 점수 분해 섹션 제거 (점수 노출 ↓, 명리 정합 ↑)
 *
 *  학자 트랙 ✗ (gauge 0) 케이스는 "다른 트랙 적성" 톤으로 자동 전환. */
interface ExtendedProps extends Props {
  /** legacy prop — 무시됨 (v9: 펼침 제거, 항상 풀 hero 표시) */
  compact?: boolean;
}

export function HagunSignerBreakdown({ manse }: ExtendedProps) {
  const breakdown = computeHagun(manse);
  const grade = scoreToGrade(breakdown.total);
  const gauge = gradeToGauge(grade.label);

  const positive = breakdown.hits.filter(h => h.value > 0).sort((a, b) => b.value - a.value);
  const top3 = positive.slice(0, 3);
  const rest = positive.slice(3);
  // 음의 값(페널티) — 화면 표시 제거 (사용자 피드백 2026-05-25)
  // const negative = breakdown.hits.filter(h => h.value < 0);

  const isWeakScholar = gauge === 0;

  // 함께 작용 영역 — 기본 접힘 (사용자 피드백: 정보 과다, 토글로)
  const [restOpen, setRestOpen] = useState(false);

  // 핵심 자리 — Filled card (elevation 1, primary)
  const renderPrimaryCell = (h: { signer: string; value: number }) => (
    <View
      key={h.signer}
      className="p-card-padding rounded-md bg-surface-container-low border border-outline-warm gap-1"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-body-bold text-body-md text-text-pri flex-1">
          {displaySigner(h.signer)}
        </Text>
        <StrengthDots value={h.value} />
      </View>
      <Text className="font-body text-label-sm text-text-sub leading-relaxed" numberOfLines={2}>
        {explainSigner(h.signer)}
      </Text>
    </View>
  );

  // 함께 작용 자리 — Outlined card (Material elevation 0, secondary)
  //   bg ✗, border만 + 작은 padding + smaller typography (NN/g visual hierarchy)
  const renderSecondaryRow = (h: { signer: string; value: number }) => (
    <View
      key={h.signer}
      className="px-3 py-2 rounded-md border border-outline-warm gap-0.5"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-body text-body-sm text-text-sub flex-1">
          {displaySigner(h.signer)}
        </Text>
        <StrengthDots value={h.value} />
      </View>
      <Text className="font-body text-label-sm text-text-sub leading-relaxed" numberOfLines={1}>
        {explainSigner(h.signer)}
      </Text>
    </View>
  );

  return (
    <View className="gap-3">
      {/* ===== Hero — 등급·티어 + 게이지 + 핵심 시그너 칩 ===== */}
      <View
        className="p-card-padding rounded-md border border-outline-warm gap-2"
        style={{ backgroundColor: isWeakScholar ? undefined : 'rgba(245, 158, 11, 0.06)' }}
      >
        <Text className="font-body text-label-sm text-text-sub uppercase tracking-wide">
          학운 그릇
        </Text>

        <View className="flex-row items-baseline gap-2 flex-wrap">
          <Text className="font-heading-bold text-display-sm text-text-pri">
            {grade.label}
          </Text>
          <Text className="font-body text-body-md text-text-sub">·</Text>
          <Text className="font-body-bold text-body-lg text-text-pri">
            {grade.baseTier}
          </Text>
        </View>

        <Text
          className="font-body text-headline-md"
          style={{ color: STAR_GOLD, letterSpacing: 4 }}
          accessibilityLabel={`강도 5점 만점에 ${gauge}점`}
        >
          {'●'.repeat(gauge)}{'○'.repeat(5 - gauge)}
        </Text>

        {top3.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-1">
            {top3.map(h => (
              <View key={h.signer} className="px-3 py-1 rounded-full bg-secondary-container">
                <Text className="font-body-bold text-label-md text-primary" numberOfLines={1}>
                  {h.signer.split(' (')[0]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="font-body text-body-sm text-text-sub leading-relaxed mt-1">
          {isWeakScholar
            ? '학자 트랙이 약한 자리예요. 다른 트랙(예술·실무·운동 등)에서 빛나는 사주일 수 있어요.'
            : '사주 시그너로 만들어진 학운 그릇이에요. 아래는 이 그릇을 만드는 자리들이에요.'}
        </Text>
      </View>

      {/* ===== 핵심 자리 (Top 3) — Filled card (primary) ===== */}
      {top3.length > 0 && (
        <View className="gap-2">
          <Text className="font-body-bold text-label-md text-text-sub">
            ✨ 핵심 자리
          </Text>
          {top3.map(renderPrimaryCell)}
        </View>
      )}

      {/* ===== 함께 작용 — 토글 (기본 접힘, 사용자 피드백) ===== */}
      {rest.length > 0 && (
        <View className="gap-1.5">
          <Pressable
            onPress={() => setRestOpen(o => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: restOpen }}
            className="flex-row items-center justify-between py-1"
          >
            <Text className="font-body text-label-md text-text-sub">
              🔹 함께 작용하는 자리 <Text className="font-body text-label-sm text-text-sub">({rest.length}개)</Text>
            </Text>
            <Text className="font-body text-label-md text-text-sub">
              {restOpen ? '접기 ▴' : '펼치기 ▾'}
            </Text>
          </Pressable>
          {restOpen && rest.map(renderSecondaryRow)}
        </View>
      )}

      {/* '약한 자리'(페널티) 영역 제거 (사용자 피드백 2026-05-25) — negativity bias 완충 위해 표시했으나
          정보 과다라 비노출. 페널티는 백엔드 계산에만 반영. */}
    </View>
  );
}
