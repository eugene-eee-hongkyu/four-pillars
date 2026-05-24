// 9명 sample × 67 detector 발동 프로필 (Phase A)
//
// 목적: 영진·정환·두흥 등 안 잡히는 sample의 detector 발동 패턴 파악
// 결과: docs/run/DETECTOR_PROFILE_9.md

import { computeManse } from '../lib/manse/engine';
import { SAMPLES } from '../_private/calibration-samples/data';
import { detectAllSigils } from './run-calibration-v3';
import { writeFileSync } from 'fs';

const SAMPLE_TARGETS = [
  { id: '03-self',    nickname: '홍규',   target: '1-2', tier: '1티어 (POSTECH)' },
  { id: '06',         nickname: '정환',   target: '1-2', tier: '1티어 (포항공대)' },
  { id: '08',         nickname: '세형',   target: '1-2', tier: '1티어 (연대 의예)' },
  { id: '10-yoonsoo', nickname: '윤수',   target: '1-1', tier: '1티어 (서울대 전기전자)' },
  { id: '11-sangsoo', nickname: '상수',   target: '1-2', tier: '1티어 (서울대 대기)' },
  { id: '09',         nickname: '두흥',   target: '3-2', tier: '외부 (경북대 치대 / 비대학)' },
  { id: '05',         nickname: '승희',   target: '3-2', tier: '4티어 → v2: 3-2 (국민대)' },
  { id: '07',         nickname: '영진',   target: '2-3', tier: '연예인 (경희대 경영 / 외부변수)' },
  { id: '04-wife',    nickname: '와이프', target: '6-2', tier: '6티어 (울산대 시각디자인)' },
];

interface DetectorRow {
  category: string;
  detector: string;
  values: Record<string, number>;
}

function categoryOf(id: string): string {
  if (id.startsWith('g_')) return '격국 (g_)';
  if (id.startsWith('s_gwanin')) return '관인상생 (s_)';
  if (id.startsWith('s_insung')) return '인성 threshold (s_)';
  if (id.startsWith('s_gwansung') || id.startsWith('s_gui')) return '관성·귀인 threshold (s_)';
  if (id.startsWith('s_')) return '십성 (s_)';
  if (id.startsWith('gw_')) return '신살 귀인 (gw_)';
  if (id.startsWith('u_')) return '12운성 (u_)';
  if (id.startsWith('d_early') || id.startsWith('d_exam')) return '대운 시기별 (d_)';
  if (id.startsWith('d_')) return '청소년 대운 (d_)';
  if (id.startsWith('sh_')) return '흉살 (sh_)';
  if (id.startsWith('cnt_')) return '카운트 (cnt_)';
  if (id.startsWith('combo_')) return '콤보 (combo_)';
  return 'misc';
}

async function main() {
  console.log(`\n=== 9명 × 67 detector 발동 프로필 ===\n`);

  // 각 sample manse 계산 + detector 발동
  const sampleSigils: Record<string, Record<string, number>> = {};
  for (const target of SAMPLE_TARGETS) {
    const sample = SAMPLES.find(s => s.id === target.id);
    if (!sample) {
      console.error(`Sample ${target.id} not found`);
      continue;
    }
    const m = computeManse({
      year: sample.birth.year, month: sample.birth.month, day: sample.birth.day,
      hour: sample.birth.hour, minute: sample.birth.minute, gender: sample.birth.gender,
    });
    sampleSigils[target.nickname] = detectAllSigils(m);
  }

  // detector ID 목록 (첫 sample 기준)
  const firstKey = Object.keys(sampleSigils)[0];
  const detectorIds = Object.keys(sampleSigils[firstKey]);

  // 카테고리별 그룹화
  const byCategory: Record<string, string[]> = {};
  for (const id of detectorIds) {
    const cat = categoryOf(id);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(id);
  }

  // markdown 출력
  const lines: string[] = [];
  lines.push('# 9명 sample × 67 detector 발동 프로필');
  lines.push('');
  lines.push('> 2026-05-24 자동 생성. 각 sample 사주에서 67개 detector 발동 여부·값 표시. 영진·정환·두흥 등 fit 안 되는 sample의 어떤 detector가 약한지 진단용.');
  lines.push('>');
  lines.push('> v2 TIER_SYSTEM 매핑 적용 후 target.');
  lines.push('');
  lines.push('## Sample 목표 위치');
  lines.push('');
  lines.push('| 닉네임 | target | 비고 |');
  lines.push('|---|---|---|');
  for (const t of SAMPLE_TARGETS) {
    lines.push(`| **${t.nickname}** | ${t.target} | ${t.tier} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // 카테고리별 detector 표
  const nicknames = SAMPLE_TARGETS.map(t => t.nickname);
  const categoryOrder = [
    '격국 (g_)',
    '관인상생 (s_)',
    '인성 threshold (s_)',
    '관성·귀인 threshold (s_)',
    '십성 (s_)',
    '신살 귀인 (gw_)',
    '12운성 (u_)',
    '청소년 대운 (d_)',
    '대운 시기별 (d_)',
    '흉살 (sh_)',
    '카운트 (cnt_)',
    '콤보 (combo_)',
  ];

  for (const cat of categoryOrder) {
    const ids = byCategory[cat];
    if (!ids || ids.length === 0) continue;
    lines.push(`## ${cat}`);
    lines.push('');
    lines.push(`| detector | ${nicknames.join(' | ')} |`);
    lines.push(`|---|${nicknames.map(() => '---').join('|')}|`);
    for (const id of ids) {
      const row = nicknames.map(nick => {
        const v = sampleSigils[nick][id];
        if (v === 0) return '·';
        if (v === 1) return '✓';
        return String(v); // count
      });
      lines.push(`| \`${id}\` | ${row.join(' | ')} |`);
    }
    lines.push('');
  }

  // 9명 발동 detector 총합 ranking
  lines.push('---');
  lines.push('');
  lines.push('## 각 sample 활성 detector 수 (sanity)');
  lines.push('');
  lines.push('| Sample | 활성 (>0) | boolean 발동 합 | count 합 |');
  lines.push('|---|---|---|---|');
  for (const nick of nicknames) {
    const sigils = sampleSigils[nick];
    let activeCount = 0;
    let boolSum = 0;
    let countSum = 0;
    for (const [id, v] of Object.entries(sigils)) {
      if (v > 0) activeCount++;
      if (id.startsWith('cnt_')) countSum += v;
      else if (v === 1) boolSum++;
    }
    lines.push(`| ${nick} | ${activeCount} | ${boolSum} | ${countSum} |`);
  }
  lines.push('');

  // 콘솔 요약
  console.log('카테고리별 detector 수:');
  for (const cat of categoryOrder) {
    const ids = byCategory[cat];
    if (ids) console.log(`  ${cat}: ${ids.length}개`);
  }
  console.log(`\n총 detector: ${detectorIds.length}개`);
  console.log(`\n각 sample 활성 detector 수:`);
  for (const nick of nicknames) {
    const sigils = sampleSigils[nick];
    let active = 0;
    for (const v of Object.values(sigils)) if (v > 0) active++;
    console.log(`  ${nick.padEnd(6)}: ${active}/${detectorIds.length}`);
  }

  writeFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/docs/run/DETECTOR_PROFILE_9.md', lines.join('\n'));
  console.log(`\n→ docs/run/DETECTOR_PROFILE_9.md 작성 완료`);
}

main().catch(e => { console.error(e); process.exit(1); });
