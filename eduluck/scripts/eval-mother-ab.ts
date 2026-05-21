// 어머니 사주 A/B 비교 — 같은 자녀 sample을 motherManse ✓ / motherManse ✗ 두 케이스로 LLM 호출.
// §14 "어머니께 한 마디" emotional impact 차이를 정량 비교.
//
// PII는 _private/calibration-samples/data.ts 에만. 이 스크립트는 ID로 sample 로드.
// 사용: pnpm tsx scripts/eval-mother-ab.ts

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

// A/B 케이스 정의
// 자녀: 01 재원 (Eugene·와이프 부부의 실제 자녀)
// 어머니: 04 wife (실제 와이프 사주)
const CHILD_ID = '01-jaewon';
const MOTHER_ID = '04-wife';

// §14 추출 — "## 14." 라인부터 "## 15." 또는 끝까지
function extractSection14(text: string): string {
  const start = text.match(/##\s*14\./);
  if (!start) return '(§14 없음)';
  const startIdx = start.index!;
  const after = text.slice(startIdx);
  const end = after.match(/\n##\s*15\./);
  return end ? after.slice(0, end.index!).trim() : after.trim();
}

// 키워드별 빈도 검증
function keywordCount(text: string, keyword: string): number {
  return (text.match(new RegExp(keyword, 'g')) ?? []).length;
}

// 분량 지표
function metrics(text: string) {
  const sentences = (text.match(/[.!?。]\s/g) ?? []).length + (text.match(/[다요죠]\.\s/g) ?? []).length;
  return {
    chars: text.length,
    sentences,
  };
}

// emotional/서포트 키워드 묶음
const KEYWORDS = [
  '어머니', '엄마',
  '도와', '함께', '곁',
  '합', '시기', '맞춤', '받쳐',
  '서포트', '응원', '이해',
  '믿음', '사랑',
  '대운', '세운',
];

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const system = getInterpretPremiumSystem();
  const childSample = getSample(CHILD_ID);
  const motherSample = getSample(MOTHER_ID);

  const childManse = computeManse(childSample.birth);
  const motherManse = computeManse(motherSample.birth);

  // === 케이스 A: 어머니 사주 ✓ ===
  console.log('\n=== 케이스 A: 어머니 사주 ✓ 입력 ===');
  const userMsgWith = buildInterpretPremiumPrompt({
    childNickname: childSample.nickname,
    childGender: childSample.birth.gender,
    grade: childSample.grade ?? 'high-2',
    childBirthYear: childSample.birth.year,
    childBirthMonth: childSample.birth.month,
    childBirthDay: childSample.birth.day,
    childManse,
    motherManse,
    fatherManse: null,
  });
  writeFileSync(`${REPORT_DIR}/ab-with-mother-user-msg.txt`, userMsgWith);

  console.log('  호출 중...');
  const respWith = await client.messages.create({
    model, max_tokens: 8192, temperature: 0.5, system,
    messages: [{ role: 'user', content: userMsgWith }],
  });
  const textWith = respWith.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  writeFileSync(`${REPORT_DIR}/ab-with-mother-output.md`, textWith);
  console.log(`  saved (${textWith.length} chars)`);

  // === 케이스 B: 어머니 사주 ✗ 미입력 ===
  console.log('\n=== 케이스 B: 어머니 사주 ✗ 미입력 ===');
  const userMsgWithout = buildInterpretPremiumPrompt({
    childNickname: childSample.nickname,
    childGender: childSample.birth.gender,
    grade: childSample.grade ?? 'high-2',
    childBirthYear: childSample.birth.year,
    childBirthMonth: childSample.birth.month,
    childBirthDay: childSample.birth.day,
    childManse,
    motherManse: null,
    fatherManse: null,
  });
  writeFileSync(`${REPORT_DIR}/ab-without-mother-user-msg.txt`, userMsgWithout);

  console.log('  호출 중...');
  const respWithout = await client.messages.create({
    model, max_tokens: 8192, temperature: 0.5, system,
    messages: [{ role: 'user', content: userMsgWithout }],
  });
  const textWithout = respWithout.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  writeFileSync(`${REPORT_DIR}/ab-without-mother-output.md`, textWithout);
  console.log(`  saved (${textWithout.length} chars)`);

  // === 분석 ===
  console.log('\n=== 분석: 본문 전체 ===');
  const fullWith = metrics(textWith);
  const fullWithout = metrics(textWithout);
  console.log(`A (어머니 ✓): ${fullWith.chars} chars / ${fullWith.sentences} 문장`);
  console.log(`B (어머니 ✗): ${fullWithout.chars} chars / ${fullWithout.sentences} 문장`);
  console.log(`Δ chars: ${fullWith.chars - fullWithout.chars} / Δ 문장: ${fullWith.sentences - fullWithout.sentences}`);

  console.log('\n=== §14 추출 비교 ===');
  const s14With = extractSection14(textWith);
  const s14Without = extractSection14(textWithout);
  const s14WithMetrics = metrics(s14With);
  const s14WithoutMetrics = metrics(s14Without);
  console.log(`A §14 (어머니 ✓): ${s14WithMetrics.chars} chars / ${s14WithMetrics.sentences} 문장`);
  console.log(`B §14 (어머니 ✗): ${s14WithoutMetrics.chars} chars / ${s14WithoutMetrics.sentences} 문장`);
  console.log(`Δ §14 chars: ${s14WithMetrics.chars - s14WithoutMetrics.chars}`);

  console.log('\n=== 키워드 등장 빈도 (본문 전체) ===');
  console.log('| 키워드 | A 어머니 ✓ | B 어머니 ✗ | Δ |');
  console.log('|---|---|---|---|');
  for (const k of KEYWORDS) {
    const a = keywordCount(textWith, k);
    const b = keywordCount(textWithout, k);
    const delta = a - b;
    const mark = delta > 2 ? ' ⭐' : delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : '';
    console.log(`| ${k} | ${a}회 | ${b}회 | ${delta >= 0 ? '+' : ''}${delta}${mark} |`);
  }

  console.log('\n=== 키워드 등장 빈도 (§14만) ===');
  console.log('| 키워드 | A §14 | B §14 | Δ |');
  console.log('|---|---|---|---|');
  for (const k of KEYWORDS) {
    const a = keywordCount(s14With, k);
    const b = keywordCount(s14Without, k);
    const delta = a - b;
    const mark = delta > 1 ? ' ⭐' : delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : '';
    console.log(`| ${k} | ${a}회 | ${b}회 | ${delta >= 0 ? '+' : ''}${delta}${mark} |`);
  }

  console.log('\n=== §14 본문 비교 ===');
  console.log('\n--- A §14 (어머니 ✓) 앞 600자 ---');
  console.log(s14With.slice(0, 600));
  console.log('\n--- B §14 (어머니 ✗) 앞 600자 ---');
  console.log(s14Without.slice(0, 600));

  console.log('\n=== 완료 ===');
})();
