// V7 — 시나리오를 absolute cutoff (V4 #195 raw) 기준으로 재측정
//
// V5 발견: 정규화 cancel out 때문에 weight 변경 효과 측정 불가
// V7: V4 #195 raw cutoff fixed → 다른 시나리오 sample 점수 raw로 계산 → 진짜 weight 효과 측정

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { writeFileSync } from 'fs';
import { SCENARIOS as V7_SCENARIOS, type CalibConfig } from './v7-scenarios';
import { V4_195_ABSOLUTE_CUTOFF, tierIndexAbsolute, getAbsoluteCutoffLabels, V4_195_BASELINE_MEAN } from './v6-absolute-cutoff';

interface SampleTarget {
  id: string; nickname: string; school: string;
  target30Index: number; targetLabel: string; weight: number;
}

const SAMPLE_TARGETS: SampleTarget[] = [
  { id: '03-self',    nickname: '홍규',  school: 'POSTECH (학과불명)',     target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '06',         nickname: '정환',  school: '포항공대(외부의지)',     target30Index: 2,  targetLabel: '1-2', weight: 0.5 },
  { id: '08',         nickname: '세형',  school: '연대 의예',   target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '10-yoonsoo', nickname: '윤수',  school: '서울대 전기전자', target30Index: 1,  targetLabel: '1-1', weight: 1 },
  { id: '11-sangsoo', nickname: '상수',  school: '서울대 대기', target30Index: 2,  targetLabel: '1-2', weight: 1 },
  { id: '09',         nickname: '두흥',  school: '경북대 치대(외부)',  target30Index: 8,  targetLabel: '3-2', weight: 0.5 },
  { id: '05',         nickname: '승희',  school: '국민대',       target30Index: 8,  targetLabel: '3-2', weight: 1 },
  { id: '07',         nickname: '영진',  school: '경희대 경영(연예인)',  target30Index: 6,  targetLabel: '2-3', weight: 0.5 },
  { id: '04-wife',    nickname: '와이프', school: '울산대 시디',       target30Index: 17, targetLabel: '6-2', weight: 1 },
];

function computeRawScore(m: ReturnType<typeof computeManse>, config: CalibConfig): number {
  const sigils = detectAllSigils(m);
  let score = config.baseScore;
  for (const [id, weight] of Object.entries(config.weights)) {
    score += (sigils[id] ?? 0) * weight;
  }
  return Math.max(0, score);
}

interface SampleResult {
  id: string; nickname: string; school: string;
  rawScore: number; tierIndex: number; tierLabel: string;
  targetIndex: number; targetLabel: string;
  gap: number;
}

function evaluateAbsolute(config: CalibConfig) {
  const cutoffLabels = getAbsoluteCutoffLabels();
  const sampleResults: SampleResult[] = [];
  let totalGap = 0;

  for (const target of SAMPLE_TARGETS) {
    const sample = SAMPLES.find(s => s.id === target.id);
    if (!sample) continue;
    const m = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    const rawScore = computeRawScore(m, config);
    const tierIdx = tierIndexAbsolute(rawScore);
    const cl = cutoffLabels[tierIdx - 1];
    const tierLabel = cl ? `${cl.tier}-${cl.sub}` : '?';
    const gap = Math.abs(tierIdx - target.target30Index);
    totalGap += gap;
    sampleResults.push({
      id: target.id, nickname: target.nickname, school: target.school,
      rawScore, tierIndex: tierIdx, tierLabel,
      targetIndex: target.target30Index, targetLabel: target.targetLabel,
      gap,
    });
  }

  return { config, sampleResults, totalGap };
}

async function main() {
  console.log(`\n=== V7: V7 시나리오를 absolute cutoff (V4 #195 raw) 기준 재측정 ===\n`);
  console.log(`기준 baseline: V4 #195 (raw mean=${V4_195_BASELINE_MEAN}, 1-1 cutoff=${V4_195_ABSOLUTE_CUTOFF[0]})\n`);

  // V4 #195 baseline 재측정 (sanity)
  const V4_BASE_WEIGHTS = {
    g_jeongin: 12, g_pyeonin: 12, g_jeonggwan: 12, g_siksin: 12, g_bigyeon: 12,
    s_gwaninCombo: 15, s_insung2: 8, s_insung3: 12,
    gw_hakdang: 4, gw_munchang: 4, gw_mungok: 2, gw_cheoneul: 4, gw_twoVirtues: 5, gw_samgwi: 5, gw_samgi: 5,
    u_dayGeonrok: 5, u_dayTonggeun: 5,
    d_youthInsung: 8, d_youthGwansung: 5,
  };
  const V4_195_CONFIG: CalibConfig = {
    id: 195, name: 'V4 #195 baseline',
    hypothesis: 'V4 best (absolute baseline)',
    baseScore: 18,
    weights: {
      ...V4_BASE_WEIGHTS,
      g_jeongin: 22, g_pyeonin: 22, g_jeonggwan: 22, g_pyeongwan: 15, g_siksin: 18, g_bigyeon: 15, g_yangin: 12, g_jeongjae: 8, g_pyeonjae: 8, g_sanggwan: 8,
      combo_allScholar: 25, combo_jarip: 20, combo_yanginScholar: 18, combo_youngshik: 12, s_gwaninCombo: 18,
      cnt_insung: 4, cnt_gui_total: 4, cnt_jaesung: -3,
      d_youthInsung: 15, d_youthGwansung: 17, d_youthJaesung: -8,
      combo_sanggwanPaeIn: 8, combo_salinSangsaeng: 8, combo_jeongjaeYonggwan: 8,
      combo_yanginSiksang: 8, combo_jaegwanSsangmi: 8, combo_jeonginTonggeunMulti: 8,
    },
  };

  const v4Result = evaluateAbsolute(V4_195_CONFIG);
  console.log(`V4 #195 baseline (absolute): totalGap=${v4Result.totalGap}`);
  for (const s of v4Result.sampleResults) {
    console.log(`  ${s.nickname.padEnd(6)} raw=${s.rawScore.toFixed(0)} → ${s.tierLabel} (목표 ${s.targetLabel}, gap=${s.gap})`);
  }

  console.log(`\n=== V7 시나리오 absolute 측정 ===\n`);

  const allResults: { scenarioId: number; result: ReturnType<typeof evaluateAbsolute> }[] = [];
  for (const config of V7_SCENARIOS) {
    const r = evaluateAbsolute(config);
    allResults.push({ scenarioId: config.id, result: r });
    console.log(`Loop ${config.id}: ${config.name.padEnd(50)} totalGap=${r.totalGap}`);
  }

  // Top 5
  const sorted = [...allResults].sort((a, b) => a.result.totalGap - b.result.totalGap);
  const top5 = sorted.slice(0, 5);
  console.log(`\n=== V7 Top 5 (absolute cutoff) ===`);
  for (let i = 0; i < top5.length; i++) {
    const r = top5[i];
    console.log(`\n#${i + 1}: Loop ${r.scenarioId} — ${r.result.config.name}`);
    console.log(`  totalGap=${r.result.totalGap}`);
    for (const s of r.result.sampleResults) {
      const arrow = s.gap === 0 ? '⭐' : s.gap < 3 ? '✓' : s.gap < 6 ? '·' : '✗';
      console.log(`  ${s.nickname.padEnd(6)} raw=${s.rawScore.toFixed(0).padStart(4)} → ${s.tierLabel.padEnd(5)} (목표 ${s.targetLabel.padEnd(5)}, gap=${s.gap}) ${arrow}`);
    }
  }

  // markdown 보고서
  const lines: string[] = [];
  lines.push('# V7 Calibration — V7 시나리오 absolute cutoff 재측정');
  lines.push('');
  lines.push(`> 2026-05-24 작성. V5에서 발견한 정규화 cancel-out 문제 해결.`);
  lines.push(`>`);
  lines.push(`> **방법**: V4 #195 raw 시뮬 분포(1만 random, seed=42)에서 30단계 cutoff 추출 → fixed baseline 등록.`);
  lines.push(`> 다른 시나리오는 sample 점수를 raw로 계산 + fixed cutoff과 비교 → tier index 매핑.`);
  lines.push(`>`);
  lines.push(`> V4 #195 baseline: mean ${V4_195_BASELINE_MEAN}, 1-1 cutoff ${V4_195_ABSOLUTE_CUTOFF[0]}.`);
  lines.push('');
  lines.push('## V4 #195 baseline 검증 (absolute cutoff sanity)');
  lines.push('');
  lines.push(`totalGap = **${v4Result.totalGap}** (V4 시뮬 결과 57과 비교)`);
  lines.push('');
  lines.push('| Sample | raw 점수 | 시뮬 위치 | 목표 | gap |');
  lines.push('|---|---|---|---|---|');
  for (const s of v4Result.sampleResults) {
    lines.push(`| ${s.nickname} | ${s.rawScore.toFixed(0)} | ${s.tierLabel} | ${s.targetLabel} | ${s.gap} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## V7 시나리오 absolute 측정 (전체 30개)');
  lines.push('');
  lines.push('| 순위 | Loop | 시나리오 | totalGap (absolute) |');
  lines.push('|---|---|---|---|');
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    lines.push(`| ${i + 1} | #${r.scenarioId} | ${r.result.config.name} | **${r.result.totalGap}** |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🏆 V7 Top 5 (absolute cutoff)');
  lines.push('');
  for (let i = 0; i < top5.length; i++) {
    const r = top5[i];
    lines.push(`### #${i + 1}: Loop ${r.scenarioId} — ${r.result.config.name}`);
    lines.push('');
    lines.push(`**totalGap**: ${r.result.totalGap}`);
    lines.push(`**가설**: ${r.result.config.hypothesis}`);
    lines.push('');
    lines.push('| Sample | 학교 | raw 점수 | 위치 | 목표 | gap |');
    lines.push('|---|---|---|---|---|---|');
    for (const s of r.result.sampleResults) {
      lines.push(`| ${s.nickname} | ${s.school} | **${s.rawScore.toFixed(0)}** | ${s.tierLabel} | ${s.targetLabel} | ${s.gap} |`);
    }
    lines.push('');
    lines.push('**weight set**:');
    lines.push('```json');
    lines.push(JSON.stringify({ baseScore: r.result.config.baseScore, weights: r.result.config.weights }, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  lines.push('');
  lines.push('## V4 #195 fixed cutoff (참고)');
  lines.push('');
  lines.push('| 30단계 | 누적 % | cutoff (raw) |');
  lines.push('|---|---|---|');
  for (const cl of getAbsoluteCutoffLabels()) {
    lines.push(`| ${cl.tier}-${cl.sub} (${cl.subLabel}) | ${cl.cumPct}% | ${cl.cutoff} |`);
  }
  lines.push('');

  writeFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/docs/run/CALIBRATION_LOOPS_V7.md', lines.join('\n'));
  console.log(`\n→ docs/run/CALIBRATION_LOOPS_V7.md 작성 완료`);
}

if (process.argv[1]?.endsWith('run-calibration-v7.ts')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
