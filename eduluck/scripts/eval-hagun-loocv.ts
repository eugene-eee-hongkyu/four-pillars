// LOOCV + Layer Ablation — Phase 5
//
// 진짜 LOOCV는 weight refit인데 우리 weight는 명리 합의로 고정 → ML 의미 LOOCV 불가.
// 대신 2가지 sensitivity analysis로 일반화 능력 측정:
//
//   (1) Cutoff LOOCV: 1명씩 빼고 1티어 sample들 cutoff 재산출 → 분산 측정
//   (2) Layer Ablation: Layer 1·2·3·4 각각 제외 시 9명 분류 변화
//
// 사용: pnpm tsx scripts/eval-hagun-loocv.ts
// 2026-05-23: 01-jaewon·02-jaeho 제거 후 N=9로 변경.

import { computeManse } from '../lib/manse/engine';
import { computeHagun, scoreToGrade } from '../lib/prompts/hagun-tier';
import { SAMPLES } from '../_private/calibration-samples/data';

// 실제 ground truth tier (data.ts notes 기반)
// '1' = 실제 1티어 진학, '1✗' = 사주 1티어 능력이나 외부 변수로 못감 (두흥),
// '외부 1~2' = 외부 명리 진단 (정합 판단 약함),
// '4', '6' = 실제 진학 티어, '외부 3~4' = 외부 진단
// 2026-05-23: 01-jaewon·02-jaeho 제거 (실제 입시 결과 미확정 sample). N=11 → N=9.
const GT: Record<string, { realTier: string; expectedVeryStrong: boolean }> = {
  '03-self':    { realTier: '1 POSTECH',     expectedVeryStrong: true  },
  '06':         { realTier: '1 포공',         expectedVeryStrong: true  },
  '08':         { realTier: '1 연대 의예',    expectedVeryStrong: true  },
  '10-yoonsoo': { realTier: '1 서울대 전자',  expectedVeryStrong: true  },
  '11-sangsoo': { realTier: '1 서울대 대기',  expectedVeryStrong: true  },
  '09':         { realTier: '1✗ (외부 변수)', expectedVeryStrong: false }, // 사주 능력 외 — 약 분류 정답
  '05':         { realTier: '4 국민대',       expectedVeryStrong: false },
  '07':         { realTier: '4 경희대',       expectedVeryStrong: false },
  '04-wife':    { realTier: '6 울산대',       expectedVeryStrong: false },
};

interface Row {
  id: string;
  nickname: string;
  realTier: string;
  total: number;
  layer1: number;
  layer2: number;
  layer3: number;
  layer4: number;
  expectedVeryStrong: boolean;
}

async function computeAllRows(): Promise<Row[]> {
  const rows: Row[] = [];
  for (const s of SAMPLES) {
    const manse = computeManse({
      year: s.birth.year, month: s.birth.month, day: s.birth.day,
      hour: s.birth.hour, minute: s.birth.minute, gender: s.birth.gender,
    });
    const hg = computeHagun(manse);
    rows.push({
      id: s.id,
      nickname: s.nickname,
      realTier: GT[s.id].realTier,
      total: hg.total,
      layer1: hg.layer1,
      layer2: hg.layer2,
      layer3: hg.layer3,
      layer4: hg.layer4,
      expectedVeryStrong: GT[s.id].expectedVeryStrong,
    });
  }
  return rows;
}

function main() {
  computeAllRows().then(rows => {
    console.log('\n=== (1) Cutoff LOOCV — 1티어 sample 1명씩 hold-out ===\n');
    console.log('현재 cutoff: ≥34 매우 강\n');
    console.log('1티어 + 외부 1~2 sample 6명 점수:');
    const tier1 = rows.filter(r => r.expectedVeryStrong);
    for (const r of tier1) console.log(`  ${r.nickname} (${r.realTier}): ${r.total}`);

    console.log('\nLOOCV — 각 sample 제외 시 나머지의 min 점수 (cutoff 후보) 측정:');
    console.log('| Hold-out | 나머지 점수 | min (LOOCV cutoff) | held-out 점수 | held-out 분류 (≥cutoff?) |');
    console.log('|---|---|---|---|---|');
    let consistent = 0;
    for (const heldOut of tier1) {
      const rest = tier1.filter(r => r.id !== heldOut.id);
      const restScores = rest.map(r => r.total).sort((a, b) => a - b);
      const loocvCutoff = restScores[0];
      const passed = heldOut.total >= loocvCutoff;
      if (passed) consistent++;
      console.log(`| ${heldOut.nickname} 제외 | ${restScores.join(',')} | ${loocvCutoff} | ${heldOut.total} | ${passed ? '✓ 매우 강' : '✗'} |`);
    }
    console.log(`\nLOOCV 정합: **${consistent}/${tier1.length}**`);

    // Cutoff 분산
    const cutoffs: number[] = [];
    for (const heldOut of tier1) {
      const rest = tier1.filter(r => r.id !== heldOut.id);
      cutoffs.push(Math.min(...rest.map(r => r.total)));
    }
    const cutoffMin = Math.min(...cutoffs);
    const cutoffMax = Math.max(...cutoffs);
    console.log(`LOOCV cutoff 범위: ${cutoffMin} ~ ${cutoffMax} (분산 ${cutoffMax - cutoffMin})`);

    // 전체 11명 LOOCV — 각 sample 제외 시 전체 분류 변화
    console.log('\n=== (2) 전체 9명 LOOCV — 각 sample 제외 후 cutoff 영향 ===\n');
    console.log('| Hold-out | LOOCV cutoff | 나머지 분류 정합 |');
    console.log('|---|---|---|');
    let totalConsistent = 0;
    for (const heldOut of rows) {
      // hold-out 이외 sample들로 cutoff 산출 (매우강 sample들 중 최소값)
      const restVeryStrong = rows.filter(r => r.id !== heldOut.id && r.expectedVeryStrong);
      if (restVeryStrong.length === 0) continue;
      const loocvCutoff = Math.min(...restVeryStrong.map(r => r.total));
      // 나머지 10명의 분류 정합 측정 (held-out 제외)
      const rest = rows.filter(r => r.id !== heldOut.id);
      let correct = 0;
      for (const r of rest) {
        const predicted = r.total >= loocvCutoff;
        if (predicted === r.expectedVeryStrong) correct++;
      }
      totalConsistent += (rest.length === correct) ? 1 : 0;
      console.log(`| ${heldOut.nickname} (${heldOut.realTier}) 제외 | ${loocvCutoff} | ${correct}/${rest.length} |`);
    }
    console.log(`\n전체 LOOCV 정합 iteration: **${totalConsistent}/${rows.length}**`);

    // ===== (3) Layer Ablation =====
    console.log('\n=== (3) Layer Ablation — 각 Layer 제외 시 매우 강 분류 변화 ===\n');
    console.log('| 제외 Layer | 1티어 5명 모두 매우 강 (≥34)? | 매우 강 분류된 sample |');
    console.log('|---|---|---|');

    const layers: Array<'L1' | 'L2' | 'L3' | 'L4'> = ['L1', 'L2', 'L3', 'L4'];
    for (const skipLayer of layers) {
      const recalcTier1: { name: string; total: number; veryStrong: boolean }[] = [];
      const recalcAll: { name: string; total: number; veryStrong: boolean; expectedVeryStrong: boolean }[] = [];
      for (const r of rows) {
        let total = r.total;
        if (skipLayer === 'L1') total -= r.layer1;
        if (skipLayer === 'L2') total -= r.layer2;
        if (skipLayer === 'L3') total -= r.layer3;
        if (skipLayer === 'L4') total -= r.layer4;
        total = Math.max(0, total);
        const veryStrong = total >= 34;
        recalcAll.push({ name: r.nickname, total, veryStrong, expectedVeryStrong: r.expectedVeryStrong });
        if (r.expectedVeryStrong && r.id !== '02-jaeho') recalcTier1.push({ name: r.nickname, total, veryStrong });
      }
      const tier1AllVeryStrong = recalcTier1.every(r => r.veryStrong);
      const veryStrongNames = recalcAll.filter(r => r.veryStrong).map(r => `${r.name}(${r.total})`).join(', ');
      console.log(`| ${skipLayer} 제외 | ${tier1AllVeryStrong ? '✓' : `✗ (${recalcTier1.filter(r => !r.veryStrong).map(r => r.name).join(',')})`} | ${veryStrongNames || '∅'} |`);
    }

    console.log('\n=== (4) 결론 ===');
    console.log('LOOCV cutoff 안정성 + Layer 의존도 측정 완료.');
  });
}

main();
