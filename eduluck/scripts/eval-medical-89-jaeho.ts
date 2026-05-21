// 02·08·09 sample LLM 1-shot 의·치·약 키워드 검증
// - 02 재호: 의대·한의대 매핑이 LLM 풀이에 등장하는지 (외부 진단과 정합)
// - 08 세형: 편관격 + 학당귀인 + 관인상생 의예 본질이 풀이에 등장하는지
// - 09 두흥: 편관격 + 묘유충 + 백호대살 = 의·치 우회 본질이 풀이에 등장하는지
//
// PII는 _private/calibration-samples/data.ts 에만. 이 스크립트는 ID로 sample 로드.
//
// 사용: pnpm tsx scripts/eval-medical-89-jaeho.ts

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
// (등장 빈도가 1+ 이면 ✓, 0이면 ✗)
const VERIFY: Record<string, { id: string; nickname: string; keywords: string[]; mustHave?: string[] }> = {
  '02-jaeho': {
    id: '02-jaeho',
    nickname: '재호',
    keywords: ['의대', '한의대', '의학', '의약', '약사', '치과', '자격', '관성', '정관', '인성', '학자', '컴공', '컴퓨터', '공학'],
    mustHave: ['관성', '인성'], // 건록격 + 관인상생 본질
  },
  '08': {
    id: '08',
    nickname: '세형',
    keywords: ['편관', '관성', '관인상생', '학당귀인', '의사', '의예', '의대', '의학', '의약', '자격', '안정', '무난', '학자', '법'],
    mustHave: ['편관', '관성'], // 편관격 본질
  },
  '09': {
    id: '09',
    nickname: '두흥',
    keywords: ['편관', '관성', '묘유충', '충', '비겁', '반복', '재시도', '우회', '의대', '치과', '치의', '의약', '백호', '실수', '시기', '경험'],
    mustHave: ['편관', '관성'], // 편관격 본질
  },
};

(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('API key 미설정'); process.exit(1); }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const system = getInterpretPremiumSystem();

  for (const sampleKey of Object.keys(VERIFY)) {
    const v = VERIFY[sampleKey];
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
    writeFileSync(`${REPORT_DIR}/${s.id}-user-msg.txt`, userMsg);

    const resp = await client.messages.create({
      model, max_tokens: 8192, temperature: 0.5, system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('');
    writeFileSync(`${REPORT_DIR}/${s.id}-output.md`, text);
    console.log(`  saved (${text.length} chars)`);

    console.log('  키워드 등장:');
    const hits: { k: string; cnt: number }[] = [];
    for (const k of v.keywords) {
      const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
      hits.push({ k, cnt });
      console.log(`    ${cnt > 0 ? '✓' : '✗'} ${k}: ${cnt}회`);
    }

    // mustHave 검증
    if (v.mustHave) {
      console.log('  Must-have 검증:');
      let allPass = true;
      for (const k of v.mustHave) {
        const cnt = (text.match(new RegExp(k, 'g')) ?? []).length;
        if (cnt === 0) {
          console.log(`    ✗ ${k} — 본질 키워드 누락`);
          allPass = false;
        }
      }
      if (allPass) console.log('    ✓ 본질 키워드 모두 등장');
    }

    // 통계
    const totalHits = hits.reduce((s, h) => s + h.cnt, 0);
    const hitKeywords = hits.filter(h => h.cnt > 0).length;
    console.log(`  ── 통계: ${hitKeywords}/${v.keywords.length} 키워드 등장, 총 ${totalHits}회`);
  }

  console.log('\n=== 완료 ===');
})();
