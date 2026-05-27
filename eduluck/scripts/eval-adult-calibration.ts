// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// 40대 어른 calibration — 사주 진단 vs 실제 결과 비교
// PII는 _private/calibration-samples/data.ts 에만. 이 스크립트는 sample ID로 로드 + 실제 결과만 정의.
// 출력: 모듈별 일치/부분/빗나감 분석

import { computeManse } from '../lib/manse/engine';
import { calculateFinalTierV2, calcCurrentLuckPhase } from '../lib/prompts/hagun-tier';
import { getSample, type CalibrationSample } from '../_private/calibration-samples/data';

interface AdultActual {
  universityTier: number;  // 입학 당시 기준 티어 1~10
  majorCategory: 'humanities' | 'social' | 'engineering' | 'natural-science' | 'medical' | 'arts';
  repeated: boolean;
  targetMissed?: boolean;
  careerApplied: boolean;
  abroadVerdict: '한국 대비 좋음' | '한국 대비 별로' | '비슷함' | '무경험';
  selfMade?: boolean;
}

interface AdultCase {
  sample: CalibrationSample;
  actual: AdultActual;
}

// 실제 결과만 코드에 (PII ✗) — sample 자체는 data.ts에서 로드
const CASES: AdultCase[] = [
  {
    sample: getSample('03-self'),
    actual: {
      universityTier: 1,
      majorCategory: 'engineering',
      repeated: true,
      targetMissed: true,  // 서울대 2번 낙방 → POSTECH
      careerApplied: true,
      abroadVerdict: '한국 대비 별로',
      selfMade: true,
    },
  },
  {
    sample: getSample('04-wife'),
    actual: {
      universityTier: 6,
      majorCategory: 'arts',
      repeated: false,
      careerApplied: true,
      abroadVerdict: '한국 대비 별로',
    },
  },
];

function evaluate(c: AdultCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`=== ${c.sample.id} (${c.sample.nickname})`);
  console.log('='.repeat(70));
  if (c.sample.notes) console.log(`(${c.sample.notes})`);

  const m: any = computeManse(c.sample.birth);

  // === 사주 기본 ===
  console.log('\n[사주 4기둥]');
  console.log(`  년주: ${m.yearPillar}(${m.yearPillarHanja})`);
  console.log(`  월주: ${m.monthPillar}(${m.monthPillarHanja})`);
  console.log(`  일주: ${m.dayPillar}(${m.dayPillarHanja})`);
  console.log(`  시주: ${m.hourPillar}(${m.hourPillarHanja})`);
  console.log(`  일간: ${m.dayPillar?.[0]}`);

  // === 오행·격국·관인상생 ===
  console.log('\n[오행]');
  console.log(`  목 ${m.elementCounts.wood} · 화 ${m.elementCounts.fire} · 토 ${m.elementCounts.earth} · 금 ${m.elementCounts.metal} · 수 ${m.elementCounts.water}`);
  console.log('\n[십성 비중]');
  console.log(`  인성 ${m.sipsin.counts.insung} · 관성 ${m.sipsin.counts.gwansung} · 식상 ${m.sipsin.counts.siksang} · 비겁 ${m.sipsin.counts.bigeop} · 재성 ${m.sipsin.counts.jaesung}`);
  console.log(`  관인상생: ${m.sipsin.isGwaninSangsaeng ? '✓' : '✗'}`);
  console.log('\n[격국]');
  console.log(`  ${m.gyeokguk.name} (월령 본기 ${m.gyeokguk.monthMainStem})`);
  console.log(`  1순위: ${m.gyeokguk.careers.primary.join(' · ')}`);
  console.log(`  2순위: ${m.gyeokguk.careers.secondary.join(' · ')}`);
  console.log(`  이공계 대안: ${m.gyeokguk.careers.engineering.join(' · ')}`);

  // === 학운 티어 (당시 입시 환경 적용) ===
  console.log('\n[학운 점수 + 티어]');
  const tier = calculateFinalTierV2({
    childManse: m, motherManse: null, fatherManse: null,
    motherEducation: undefined, fatherEducation: undefined,
  });
  console.log(`  학운 점수: ${tier.hagunScore}`);
  console.log(`  학운 단계: ${tier.hagunLabel}`);
  console.log(`  베이스 티어: ${tier.baseTier}`);
  console.log(`  최종 추천: ${tier.finalTierRange[0] === tier.finalTierRange[1] ? `${tier.finalTierRange[0]}티어` : `${tier.finalTierRange[0]}~${tier.finalTierRange[1]}티어`}`);
  console.log(`  Confidence: "${tier.confidenceLabel}"`);

  // === 해외운 ===
  console.log('\n[해외운]');
  console.log(`  ${m.abroadScore.summary}`);
  for (const sig of m.abroadScore.signals) {
    const mark = sig.matched ? `✓ +${sig.weight}` : `✗  0`;
    console.log(`    [${mark}] ${sig.name}`);
  }

  // === 예술·디자인 점수 ===
  console.log('\n[예술·디자인]');
  console.log(`  ${m.artsScore.summary}`);
  for (const sig of m.artsScore.signals) {
    const mark = sig.matched ? `✓ +${sig.weight}` : `✗  0`;
    console.log(`    [${mark}] ${sig.name}`);
  }
  if (m.artsScore.recommendedFields.length > 0) {
    console.log(`  추천 분야: ${m.artsScore.recommendedFields.join(' / ')}`);
  }

  // === 신살 ===
  console.log('\n[신살]');
  console.log(`  년주: ${m.shensha.yearPillar.join(', ') || '없음'}`);
  console.log(`  월주: ${m.shensha.monthPillar.join(', ') || '없음'}`);
  console.log(`  일주: ${m.shensha.dayPillar.join(', ') || '없음'}`);
  console.log(`  시주: ${m.shensha.hourPillar.join(', ') || '없음'}`);
  console.log(`  강조: ${m.shensha.strong.join(', ') || '없음'}`);

  // === 합·충·형 ===
  console.log('\n[합충형해]');
  console.log(`  ${m.hapchunh.summary || '없음'}`);

  // === 대운 18~25 (입시 시기) ===
  console.log('\n[대운 — 입시기 18~25세]');
  const collegeAge = m.luckCycles.daeun.filter((d: any) => d.age >= 8 && d.age <= 35);
  for (const d of collegeAge) {
    console.log(`  ${d.age}세~ ${d.stem}${d.branch} (${d.stemSipsin}·${d.branchSipsin})`);
  }

  // ============================================================
  // === 실제 vs 시스템 비교 ===
  // ============================================================
  console.log('\n' + '─'.repeat(70));
  console.log('=== 실제 vs 시스템 비교');
  console.log('─'.repeat(70));

  // 1. 학교 티어 매칭
  const recommended = tier.finalTierRange;
  const actual = c.actual.universityTier;
  const inRange = actual >= recommended[0] - 1 && actual <= recommended[1] + 1;
  const judge1 = actual === recommended[0] || actual === recommended[1]
    ? '✓ 정확 일치'
    : inRange ? '△ ±1티어 안 (양호)' : '✗ 빗나감';
  console.log(`\n1) 학교 티어`);
  console.log(`   시스템 추천: ${recommended[0]}~${recommended[1]}티어`);
  console.log(`   실제: ${actual}티어`);
  console.log(`   판정: ${judge1}`);
  if (c.actual.targetMissed) {
    console.log(`   * 목표 학교 낙방 — confidence "도전+안정" 패턴 정합`);
  }

  // 2. 전공·격국 매칭 (artsScore 보정 적용)
  const isArts = c.actual.majorCategory === 'arts';
  const isEngineering = c.actual.majorCategory === 'engineering';
  const recommendsArts = m.artsScore.level === '강' || m.artsScore.level === '매우 강';
  const recommendsEngineering = m.gyeokguk.careers.engineering.length > 0;

  let judge2 = '';
  if (isArts && recommendsArts) judge2 = `✓ artsScore "${m.artsScore.level}" — 예술 진로 보정 작동`;
  else if (isArts && !recommendsArts) judge2 = `✗ artsScore "${m.artsScore.level}" — 예술 시그너 못 잡음`;
  else if (isEngineering && recommendsEngineering) judge2 = '✓ 격국 이공계 매핑 ✓';
  else judge2 = '✗ 불일치';
  console.log(`\n2) 전공`);
  console.log(`   시스템 격국: ${m.gyeokguk.name}`);
  console.log(`   시스템 artsScore: ${m.artsScore.summary}`);
  console.log(`   실제 majorCategory: ${c.actual.majorCategory}`);
  console.log(`   판정: ${judge2}`);

  // 3. 해외운 매칭
  const actualVerdict = c.actual.abroadVerdict;
  const systemLevel = m.abroadScore.level;
  let judge3 = '';
  if (actualVerdict === '무경험') judge3 = '— (검증 ✗ — 해외 거주 무경험)';
  else if (actualVerdict === '한국 대비 좋음' && (systemLevel === '강' || systemLevel === '무조건')) judge3 = '✓ 일치 (해외 강 + 실제 좋음)';
  else if (actualVerdict === '한국 대비 별로' && (systemLevel === '약' || systemLevel === '보통')) judge3 = '✓ 일치 (해외 약~보통 + 실제 별로 — 환경 ✗ 개인 운기 영역)';
  else if (actualVerdict === '비슷함' && systemLevel === '보통') judge3 = '✓ 일치';
  else judge3 = `✗ 불일치 (시스템 ${systemLevel} vs 실제 ${actualVerdict})`;
  console.log(`\n3) 해외운`);
  console.log(`   시스템: ${m.abroadScore.summary}`);
  console.log(`   실제: "${actualVerdict}"`);
  console.log(`   판정: ${judge3}`);

  // 4. 자수성가·재성 (참고)
  if (c.actual.selfMade) {
    console.log(`\n4) 자수성가 (참고)`);
    console.log(`   재성: ${m.sipsin.counts.jaesung} / 식상: ${m.sipsin.counts.siksang} / 비겁: ${m.sipsin.counts.bigeop}`);
    console.log(`   * 학운 모듈은 자수성가 진단 ✗. 별도 모듈 후보`);
  }
}

for (const c of CASES) evaluate(c);
