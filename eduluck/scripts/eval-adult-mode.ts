// 성인 회고 모드 (grade='adult') LLM 1-shot 검증
// §13 학교 회고 / §14 과거 입시 시기 흔들림 / §16 본인 청자 전환 확인
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
try {
  const envText = readFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

import { computeManse } from '../lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '../lib/prompts/interpret-premium';
import { getSample } from '../_private/calibration-samples/data';

const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/calibration-samples/llm-output';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  const system = getInterpretPremiumSystem();

  // 03 Eugene (POSTECH 졸업한 어른) — grade='adult' 회고 모드
  const s = getSample('03-self');
  const m = computeManse(s.birth);
  const userMsg = buildInterpretPremiumPrompt({
    childNickname: s.nickname,
    childGender: s.birth.gender,
    grade: 'adult',
    childBirthYear: s.birth.year,
    childBirthMonth: s.birth.month,
    childBirthDay: s.birth.day,
    childManse: m,
    motherManse: null,
    fatherManse: null,
  });
  writeFileSync(`${REPORT_DIR}/adult-eugene-user-msg.txt`, userMsg);

  console.log('--- 03 Eugene (1976 출생, grade=adult 성인 회고) 호출 중 ---');
  const resp = await client.messages.create({
    model, max_tokens: 8192, temperature: 0.5, system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  writeFileSync(`${REPORT_DIR}/adult-eugene-output.md`, text);
  console.log(`  saved (${text.length} chars)`);

  // 검증 — §16 본인 청자 전환·§13 과거 회고·§14 입시 시기
  console.log('\n[§13 학교 — 과거 회고 톤]');
  const s13Match = text.match(/##\s*13\.[\s\S]*?(?=\n##\s*14\.)/);
  if (s13Match) {
    const s13 = s13Match[0];
    console.log(`  §13 길이: ${s13.length} chars`);
    for (const k of ['사주', '대학', '회고', '실제', '갔']) {
      const cnt = (s13.match(new RegExp(k, 'g')) ?? []).length;
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }
  }

  console.log('\n[§14 조심 한 해 — 과거 입시 시기 회고]');
  const s14Match = text.match(/##\s*14\.[\s\S]*?(?=\n##\s*15\.)/);
  if (s14Match) {
    const s14 = s14Match[0];
    console.log(`  §14 길이: ${s14.length} chars`);
    // 1990s 연도가 등장하는지 (eugene 18~20세 = 1993~1995)
    const yearMatch = s14.match(/19[89]\d년|20\d\d년/g);
    console.log(`    ✓ 연도 명시: ${yearMatch ? yearMatch.join(', ') : '없음'}`);
  }

  console.log('\n[§16 본인 청자 전환 확인]');
  const s16Match = text.match(/##\s*16\.[\s\S]*/);
  if (s16Match) {
    const s16 = s16Match[0];
    const header = s16.split('\n')[0];
    console.log(`  §16 헤더: ${header}`);
    const isBonin = header.includes('에게') && !header.includes('어머니') && !header.includes('어머님');
    console.log(`  ${isBonin ? '✓ 본인 청자 전환 ⭐' : '⚠ 어머니 청자 그대로'}`);
  }

  console.log('\n=== 완료 ===');
})();
