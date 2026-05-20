// 재원 사주로 새 abroad-score baseline이 LLM §10에 잘 반영되는지 1회 호출 확인

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

try {
  const envText = readFileSync('/Users/eugene/Downloads/coding/four-pillars/eduluck/.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

import { computeManse } from '/Users/eugene/Downloads/coding/four-pillars/eduluck/lib/manse/engine';
import { getInterpretPremiumSystem, buildInterpretPremiumPrompt } from '/Users/eugene/Downloads/coding/four-pillars/eduluck/lib/prompts/interpret-premium';

const REPORT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/prompts-eval/jaewon-test';
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}

const childManse = computeManse({ year: 2008, month: 6, day: 27, hour: 15, minute: 30, gender: 'male' });

const ctx = {
  childNickname: '재원',
  childGender: 'male' as const,
  grade: 'high-2',  // 재원 17세 = 고2
  childBirthYear: 2008,
  childBirthMonth: 6,
  childBirthDay: 27,
  childManse,
  motherManse: null,
  fatherManse: null,
};

const system = getInterpretPremiumSystem();
const userMsg = buildInterpretPremiumPrompt(ctx);

writeFileSync(`${REPORT_DIR}/system.txt`, system);
writeFileSync(`${REPORT_DIR}/user-message.txt`, userMsg);

console.log('=== 재원 사주 계산 결과 ===');
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

  // §10 섹션 추출
  const section10Match = text.match(/##\s*10\.\s.*?(?=##\s*11\.|$)/s);
  if (section10Match) {
    console.log();
    console.log('=== §10 국가·해외 운 발췌 ===');
    console.log(section10Match[0]);
  } else {
    console.log('§10 섹션 못 찾음');
  }

  // 해외 키워드 카운트
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
