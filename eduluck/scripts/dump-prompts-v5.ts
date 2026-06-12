// @ts-nocheck — legacy calibration/eval script. v2 refactor 후 미동작 가능.
// Phase 1 검증 — v5 prompt 3종 dump (part1·part2·deep §10)
// sample 1개로 system + user message 전체 출력 + 길이 확인

import { computeManse } from '@/lib/manse/engine';
import { getSample } from '../_private/calibration-samples/data';
import {
  getInterpretPremiumPart1System,
  buildInterpretPremiumPart1Prompt,
} from '@/lib/prompts/interpret-premium-part1';
import {
  getInterpretPremiumPart2System,
  buildInterpretPremiumPart2Prompt,
} from '@/lib/prompts/interpret-premium-part2';
import {
  getInterpretDeepSystem,
  buildInterpretDeepPrompt,
} from '@/lib/prompts/interpret-deep';
import type { InterpretPremiumContext } from '@/lib/prompts/interpret-premium-shared';

const SAMPLE_ID = process.argv.find((a, i) => i >= 2 && !a.startsWith('-')) ?? '03-self';
const sample = getSample(SAMPLE_ID);

const childManse = computeManse({
  year: sample.birth.year,
  month: sample.birth.month,
  day: sample.birth.day,
  hour: sample.birth.hour,
  minute: sample.birth.minute,
  gender: sample.birth.gender,
});

const ctx: InterpretPremiumContext = {
  childNickname: sample.nickname,
  childGender: sample.birth.gender,
  grade: sample.grade ?? 'high-3',
  childBirthYear: sample.birth.year,
  childBirthMonth: sample.birth.month,
  childBirthDay: sample.birth.day,
  childManse,
  motherManse: null,
  fatherManse: null,
};

function dumpSection(label: string, system: string, user: string) {
  const total = system.length + user.length;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${label}`);
  console.log(`  system: ${system.length} chars`);
  console.log(`  user:   ${user.length} chars`);
  console.log(`  total:  ${total} chars (~${Math.round(total / 4)} tokens 어림)`);
  console.log(`${'='.repeat(80)}`);
}

console.log(`\n📋 Sample: ${SAMPLE_ID} (${sample.nickname}, ${sample.grade ?? 'high-3'})`);
console.log(`   생년월일: ${sample.birth.year}-${sample.birth.month}-${sample.birth.day} ${sample.birth.hour ?? '?'}:${sample.birth.minute ?? '?'}`);
console.log(`   격국: ${childManse.gyeokguk.name}`);
console.log(`   학운 라벨 (코드 결정): ${childManse.scores.totalLabel ?? '?'}`);

// Part 1
const part1Sys = getInterpretPremiumPart1System();
const part1User = buildInterpretPremiumPart1Prompt(ctx);
dumpSection('PART 1 (7 섹션 — 본질·인성·관계·즉시 행동)', part1Sys, part1User);
if (process.env.SHOW_FULL === '1') {
  console.log('\n--- Part 1 USER MESSAGE ---');
  console.log(part1User);
}

// Part 2
const part2Sys = getInterpretPremiumPart2System();
const part2User = buildInterpretPremiumPart2Prompt(ctx);
dumpSection('PART 2 (7 섹션 — 학원·진로·미래)', part2Sys, part2User);
if (process.env.SHOW_FULL === '1') {
  console.log('\n--- Part 2 USER MESSAGE ---');
  console.log(part2User);
}

// Deep-dive — 신규 4 섹션 (§7 건강 / §8 엄마합 / §9 아버지합 / §10 강요금지)
const deepSys = getInterpretDeepSystem();
for (const section of [7, 8, 9, 10]) {
  const deepUser = buildInterpretDeepPrompt(ctx, section);
  dumpSection(`DEEP §${section} (단일 섹션 deep-dive)`, deepSys, deepUser);
  if (process.env.SHOW_FULL === '1') {
    console.log(`\n--- Deep §${section} USER MESSAGE ---`);
    console.log(deepUser);
  }
}

// --write 또는 WRITE_MD=1 — system prompt를 docs/prompts/*.md로 저장 (사람이 IDE에서 markdown으로 읽기 좋게)
if (process.argv.includes('--write') || process.env.WRITE_MD === '1') {
  const fs = require('fs');
  const dir = 'docs/prompts';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/interpret-premium-part1.md`, part1Sys);
  fs.writeFileSync(`${dir}/interpret-premium-part2.md`, part2Sys);
  fs.writeFileSync(`${dir}/interpret-deep.md`, deepSys);
  console.log(`\n📝 ${dir}/*.md 3개 갱신 (part1·part2·deep) — lib/prompts/*.ts에서 자동 dump`);
}

console.log(`\n✅ Prompt dump complete. SHOW_FULL=1로 본문 전체 확인 / --write 또는 WRITE_MD=1로 docs/prompts/*.md 갱신.`);
console.log(`(prompt 원본은 lib/prompts/*.ts — md는 IDE 가독성용 사본)`);
