// Phase 1~4 종합 LLM 검증 — §9 조심 한 해 + §13 본질 깨우는 액션 + §14 현재 시점 매트릭스
// 검증 sample: 02 재호 (입시 자녀) + 08 세형 (의예 어른) + 09 두흥 (수능 0점 사고)
//
// 키워드 카테고리:
//   §9 조심 한 해: "흔들리는·집중력·결정" + 구체 연도/나이
//   §13 본질 액션: "본질·받쳐·환경·자격증" (단정 ✗: SKY·무조건 ✗)
//   §14 현재 시점: "지금·시기·우선순위·어머님이 잡아"

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

interface Verify {
  id: string;
  nickname: string;
  // §9 조심 한 해 — 자녀 입시 시기 sample만 의미 (02), 어른은 약화
  criticalKeywords: string[];
  // §13 본질 액션
  essenceKeywords: string[];
  // §14 현재 시점
  motherTodayKeywords: string[];
  // 거짓 희망 금지 — 등장하면 ✗ (단정 표현)
  forbidPatterns: RegExp[];
}

const TESTS: Verify[] = [
  {
    id: '02-jaeho', nickname: '재호',
    criticalKeywords: ['흔들', '집중', '결정', '시기'],
    essenceKeywords: ['본질', '받쳐', '환경', '자격'],
    motherTodayKeywords: ['지금', '시기', '어머님', '잡아'],
    forbidPatterns: [/무조건\s*SKY/, /SKY\s*확정/, /명문대\s*보장/],
  },
  {
    id: '08', nickname: '세형',
    criticalKeywords: ['흔들', '집중', '시기'],
    essenceKeywords: ['본질', '받쳐', '환경'],
    motherTodayKeywords: ['지금', '시기', '어머님'],
    forbidPatterns: [/무조건/, /확정/, /보장/],
  },
  {
    id: '09', nickname: '두흥',
    criticalKeywords: ['흔들', '집중', '결정', '실수'],
    essenceKeywords: ['본질', '받쳐', '환경'],
    motherTodayKeywords: ['지금', '시기', '어머님'],
    forbidPatterns: [/무조건/, /확정/, /보장/],
  },
];

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  const system = getInterpretPremiumSystem();

  for (const v of TESTS) {
    const s = getSample(v.id);
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
    writeFileSync(`${REPORT_DIR}/p14-${s.id}-user-msg.txt`, userMsg);

    const resp = await client.messages.create({
      model, max_tokens: 8192, temperature: 0.5, system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    writeFileSync(`${REPORT_DIR}/p14-${s.id}-output.md`, text);
    console.log(`  saved (${text.length} chars)`);

    // §9 검증
    console.log('  §9 조심 한 해:');
    for (const k of v.criticalKeywords) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }

    // §13 본질 액션
    console.log('  §13 본질 깨우는 액션:');
    for (const k of v.essenceKeywords) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }

    // §14 현재 시점
    console.log('  §14 현재 시점:');
    for (const k of v.motherTodayKeywords) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }

    // 거짓 희망 금지
    console.log('  거짓 희망 금지:');
    let forbidden = false;
    for (const p of v.forbidPatterns) {
      const match = text.match(p);
      if (match) {
        console.log(`    ⚠️ 단정 표현 발견: "${match[0]}"`);
        forbidden = true;
      }
    }
    if (!forbidden) console.log('    ✓ 거짓 희망 단정 표현 ✗');
  }

  console.log('\n=== 완료 ===');
})();
