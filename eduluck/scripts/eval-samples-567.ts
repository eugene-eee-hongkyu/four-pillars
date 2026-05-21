// 05·06·07 sample LLM 1-shot 검증
// PII는 _private/calibration-samples/data.ts 에만. 이 스크립트는 ID로 sample 로드.
//
// 사용: pnpm tsx scripts/eval-samples-567.ts

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

// 검증 키워드 — LLM 풀이에 등장해야 정합
const VERIFY: Record<string, string[]> = {
  '05': ['자형', '이동', '디자인', '상관'],
  '06': ['정재', '관리', '학당귀인', '관인상생', '안정', '꾸준'],
  '07': ['상관', '도화', '화개', '방송', '연예', '미디어', '예술', '디자인'],
};

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const system = getInterpretPremiumSystem();

  for (const id of ['05', '06', '07']) {
    const s = getSample(id);
    console.log(`\n--- ${s.id} (${s.nickname}) 호출 중 ---`);
    const m = computeManse(s.birth);
    const userMsg = buildInterpretPremiumPrompt({
      childNickname: s.nickname,
      childGender: s.birth.gender,
      grade: s.grade ?? 'high-3',
      childBirthYear: s.birth.year,
      childBirthMonth: s.birth.month,
      childBirthDay: s.birth.day,
      childManse: m,
      motherManse: null,
      fatherManse: null,
    });
    writeFileSync(`${REPORT_DIR}/${s.id}-user-msg.txt`, userMsg);

    const resp = await client.messages.create({
      model, max_tokens: 8192, temperature: 0.5, system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    writeFileSync(`${REPORT_DIR}/${s.id}-output.md`, text);
    console.log(`  saved (${text.length} chars)`);

    console.log('  키워드 등장:');
    for (const k of VERIFY[id] ?? []) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }
  }
})();
