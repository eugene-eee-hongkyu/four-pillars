// Phase C 자연성 평가 (2026-05-23)
//
// 목적: recommendedFields에 추가한 "환경:" 키워드가 LLM §12 풀이에 어떻게 등장하는지 측정.
//   - "환경" 단어 직접 등장 비율
//   - 환경 키워드(깊은 탐구·장기 프로젝트·표현 등) 자연 등장 빈도
//   - 직업명 단정 vs 환경 표현 균형
//
// 전제: scripts/eval-v7-all-11.ts 실행 후 _private/calibration-samples/llm-output/v7-{id}-output.md 존재
//
// 사용: npx tsx scripts/eval-direction-naturalness.ts

import { readFileSync, existsSync } from 'fs';
import { SAMPLES } from '../_private/calibration-samples/data';

const OUTPUT_DIR = '/Users/eugene/Downloads/coding/four-pillars/eduluck/_private/calibration-samples/llm-output';

// 환경 관련 표현 keywords (recommendedFields의 "환경:" 줄에서 추출)
const ENV_KEYWORDS = [
  '환경',           // "환경: ..." 직접 노출
  '잘 풀려요',      // "환경: ... 잘 풀려요" 어구
  '깊게 파고드',    // Scholar 환경
  '장기 프로젝트',  // Scholar 환경
  '혼자 집중',      // Scholar 환경
  '규칙·체계',      // Authority 환경
  '전문성 누적',    // Authority 환경
  '구조·시스템',    // Engineer 환경
  '논리적',         // Engineer 환경
  '실무·관리',      // Business 환경
  '이동·전환',      // Entrepreneur 환경
  '자율',           // Entrepreneur 환경
  '표현·창작',      // Arts 환경
  '감각',           // Arts 환경
  '현장',           // Action 환경
  '체력',           // Action 환경
  '생명·치유',      // Medical 환경
  '정밀',           // Medical 환경
];

// 직업명 단정 vs 환경 표현 balance — 단정 표현 검출
const ASSERTION_PATTERNS = [
  /확실한 [0-9]+티어/,
  /확실히/,
  /타고난 [^ ]+(?:대생|직업|학자)/,
  /무조건/,
];

interface SampleResult {
  id: string;
  nickname: string;
  exists: boolean;
  chars: number;
  envKeywordHits: { keyword: string; count: number }[];
  envWordCount: number;       // "환경" 단어 등장
  pulRyeoyoCount: number;     // "잘 풀려요" 등장
  assertionWarnings: string[]; // 단정 표현 검출
  totalEnvScore: number;       // 환경 키워드 종합 점수 (0-100)
}

function analyzeSample(id: string, nickname: string): SampleResult {
  const path = `${OUTPUT_DIR}/v7-${id}-output.md`;
  if (!existsSync(path)) {
    return { id, nickname, exists: false, chars: 0, envKeywordHits: [], envWordCount: 0, pulRyeoyoCount: 0, assertionWarnings: [], totalEnvScore: 0 };
  }
  const text = readFileSync(path, 'utf8');

  const envKeywordHits = ENV_KEYWORDS.map(k => {
    const count = (text.match(new RegExp(k, 'g')) ?? []).length;
    return { keyword: k, count };
  });

  const envWordCount = (text.match(/환경/g) ?? []).length;
  const pulRyeoyoCount = (text.match(/잘 풀려요/g) ?? []).length;

  const assertionWarnings: string[] = [];
  for (const pat of ASSERTION_PATTERNS) {
    const matches = text.match(new RegExp(pat, 'g'));
    if (matches) assertionWarnings.push(`${pat}: ${matches.length}회`);
  }

  // 종합 점수: 환경 키워드 등장 횟수 / 환경 키워드 종류
  const totalHits = envKeywordHits.reduce((s, k) => s + k.count, 0);
  const totalEnvScore = totalHits;

  return { id, nickname, exists: true, chars: text.length, envKeywordHits, envWordCount, pulRyeoyoCount, assertionWarnings, totalEnvScore };
}

function main() {
  console.log('# Phase C 자연성 평가 — LLM 풀이의 환경 키워드 등장 분석\n');

  const results = SAMPLES.map(s => analyzeSample(s.id, s.nickname));

  console.log('## 1. Sample별 환경 키워드 등장 요약\n');
  console.log('| Sample | chars | "환경" | "잘 풀려요" | env 키워드 합 | 단정 표현 |');
  console.log('|---|---|---|---|---|---|');
  for (const r of results) {
    if (!r.exists) {
      console.log(`| ${r.nickname} | output ✗ | - | - | - | - |`);
      continue;
    }
    const assertion = r.assertionWarnings.length > 0 ? `⚠ ${r.assertionWarnings.length}` : '-';
    console.log(`| ${r.nickname} | ${r.chars} | ${r.envWordCount} | ${r.pulRyeoyoCount} | ${r.totalEnvScore} | ${assertion} |`);
  }

  console.log('\n## 2. 환경 키워드 종류별 등장 빈도 (전체 sample 합)\n');
  const aggKeywords = ENV_KEYWORDS.map(k => {
    const sum = results.reduce((s, r) => s + (r.envKeywordHits.find(h => h.keyword === k)?.count ?? 0), 0);
    return { keyword: k, count: sum };
  }).sort((a, b) => b.count - a.count);

  console.log('| 키워드 | 등장 합계 |');
  console.log('|---|---|');
  for (const a of aggKeywords) {
    console.log(`| ${a.keyword} | ${a.count} |`);
  }

  console.log('\n## 3. 단정 표현 검출 (있으면 ⚠)\n');
  const withAssertions = results.filter(r => r.assertionWarnings.length > 0);
  if (withAssertions.length === 0) {
    console.log('✓ 검출 ✗ — 모든 sample에서 "확실한 N티어", "확실히", "타고난 OO대생", "무조건" 등 단정 표현 미검출');
  } else {
    for (const r of withAssertions) {
      console.log(`- **${r.nickname}**: ${r.assertionWarnings.join(', ')}`);
    }
  }

  console.log('\n## 4. 정성 평가 가이드\n');
  const totalSamples = results.filter(r => r.exists).length;
  const envCoverageSamples = results.filter(r => r.exists && r.envWordCount > 0).length;
  const pulRyeoyoSamples = results.filter(r => r.exists && r.pulRyeoyoCount > 0).length;
  console.log(`- 분석 sample: ${totalSamples} / ${results.length}`);
  console.log(`- "환경" 단어 등장 sample: ${envCoverageSamples} / ${totalSamples} (${((envCoverageSamples / totalSamples) * 100).toFixed(0)}%)`);
  console.log(`- "잘 풀려요" 등장 sample: ${pulRyeoyoSamples} / ${totalSamples} (${((pulRyeoyoSamples / totalSamples) * 100).toFixed(0)}%)`);
  console.log(`- 단정 표현 검출 sample: ${withAssertions.length} / ${totalSamples}`);

  console.log(`\n해석 가이드:`);
  console.log(`- envWordCount ≥ 3 + assertion 0 → LLM이 환경 표현을 잘 받음 (Phase C 성공)`);
  console.log(`- envWordCount 0~1 → LLM이 환경 키워드 무시. recommendedFields 마지막 환경 줄 형식 조정 필요`);
  console.log(`- assertion 검출 → 기존 표현 약화(interpret-premium.ts §13) 누락 가능성. LLM 출력 수동 검토 필요`);
}

main();
