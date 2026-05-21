// Sample 01 (jaewon) LLM 1-shot abroad-score §10 검증
// PII는 _private/calibration-samples/data.ts 에만.

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

const s = getSample('01-jaewon');
const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/prompts-eval/jaewon-test';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

const childManse = computeManse(s.birth);

const ctx = {
  childNickname: s.nickname,
  childGender: s.birth.gender,
  grade: s.grade ?? 'high-2',
  childBirthYear: s.birth.year,
  childBirthMonth: s.birth.month,
  childBirthDay: s.birth.day,
  childManse,
  motherManse: null,
  fatherManse: null,
};

const system = getInterpretPremiumSystem();
const userMsg = buildInterpretPremiumPrompt(ctx);

writeFileSync(`${REPORT_DIR}/system.txt`, system);
writeFileSync(`${REPORT_DIR}/user-message.txt`, userMsg);

console.log(`=== ${s.id} (${s.nickname}) 사주 계산 결과 ===`);
console.log(`abroadScore: ${childManse.abroadScore.summary}`);
console.log();

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  console.log('--- LLM 호출 중 ---');
  const resp = await client.messages.create({
    model, max_tokens: 8192, temperature: 0.5, system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  writeFileSync(`${REPORT_DIR}/run-1.md`, text);
  console.log(`saved (${text.length}자)`);

  const section10Match = text.match(/##\s*10\.\s.*?(?=##\s*11\.|$)/s);
  if (section10Match) {
    console.log();
    console.log('=== §10 국가·해외 운 발췌 ===');
    console.log(section10Match[0]);
  } else {
    console.log('§10 섹션 못 찾음');
  }

  console.log();
  console.log('=== 해외 관련 키워드 카운트 ===');
  console.log(`해외: ${(text.match(/해외/g) ?? []).length}회`);
  console.log(`외국: ${(text.match(/외국/g) ?? []).length}회`);
  console.log(`미국: ${(text.match(/미국/g) ?? []).length}회`);
  console.log(`영국: ${(text.match(/영국/g) ?? []).length}회`);
  console.log(`싱가포르: ${(text.match(/싱가포르/g) ?? []).length}회`);
  console.log(`캐나다: ${(text.match(/캐나다/g) ?? []).length}회`);
  console.log(`엄마가: ${(text.match(/엄마가\s+[가-힣]/g) ?? []).length}회`);
})();
