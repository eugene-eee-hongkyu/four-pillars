// 매트릭스 러너: prompts × fixtures 곱셈으로 sajutalk 앱 호출 후 결과 저장
//
// 사용법:
//   npm run test                              # 전체 곱셈
//   npm run test -- --prompt interpret-daily  # 특정 prompt만
//   npm run test -- --fixture leehonggyu      # 특정 fixture만
//   npm run test -- --prompt X --fixture Y    # 1개만
//
// 전제: sajutalk dev 서버가 http://localhost:3002 에서 실행 중

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SAJUTALK_URL = process.env.SAJUTALK_URL || 'http://localhost:3002';
const PROMPTS_DIR = path.resolve(ROOT, '..', 'sajutalk', 'prompts');
const FIXTURES_DIR = path.join(ROOT, 'fixtures');
const CURRENT_DIR = path.join(ROOT, 'outputs', 'current');

interface Fixture {
  name: string;
  gender: 'male' | 'female';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  concern: string;
  pattern: string;
  tone?: 'daily' | 'premium';
  calibration?: unknown;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { prompt?: string; fixture?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt') out.prompt = args[++i];
    else if (args[i] === '--fixture') out.fixture = args[++i];
  }
  return out;
}

function listPrompts(filter?: string): string[] {
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.error(`✖ prompts 디렉토리 없음: ${PROMPTS_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.md'));
  const names = files.map(f => f.replace(/\.md$/, ''));
  return filter ? names.filter(n => n === filter) : names;
}

function listFixtures(filter?: string): string[] {
  const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json'));
  const names = files.map(f => f.replace(/\.json$/, ''));
  return filter ? names.filter(n => n === filter) : names;
}

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function checkServer(): Promise<boolean> {
  try {
    const res = await fetch(`${SAJUTALK_URL}/`);
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchManse(fx: Fixture) {
  const res = await fetch(`${SAJUTALK_URL}/api/manse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: fx.birthYear, month: fx.birthMonth, day: fx.birthDay,
      hour: fx.birthHour, minute: fx.birthMinute, gender: fx.gender,
    }),
  });
  if (!res.ok) throw new Error(`/api/manse 실패: ${res.status}`);
  return await res.json();
}

async function runInterpret(promptName: string, fx: Fixture, manse: unknown): Promise<string> {
  const tone = promptName.endsWith('-premium') ? 'premium' : 'daily';
  const res = await fetch(`${SAJUTALK_URL}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fx.name, gender: fx.gender, birthYear: fx.birthYear,
      concern: fx.concern, pattern: fx.pattern, fullManse: manse,
      tone, calibration: fx.calibration,
    }),
  });
  if (!res.ok) throw new Error(`/api/interpret 실패: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let output = '';
  process.stdout.write('  스트리밍: ');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    output += chunk;
    process.stdout.write('.');
  }
  process.stdout.write(' 완료\n');
  return output;
}

async function main() {
  const { prompt: promptArg, fixture: fixtureArg } = parseArgs();

  if (!await checkServer()) {
    console.error(`✖ sajutalk dev 서버 응답 없음 (${SAJUTALK_URL})`);
    console.error(`   먼저 다른 터미널에서 실행: cd sajutalk && npm run dev -- --port 3002`);
    process.exit(1);
  }

  const prompts = listPrompts(promptArg);
  const fixtures = listFixtures(fixtureArg);

  if (prompts.length === 0) {
    console.error(`✖ 프롬프트 없음 (필터: ${promptArg ?? '전체'})`);
    process.exit(1);
  }
  if (fixtures.length === 0) {
    console.error(`✖ fixture 없음 (필터: ${fixtureArg ?? '전체'})`);
    process.exit(1);
  }

  fs.mkdirSync(CURRENT_DIR, { recursive: true });

  console.log(`▸ 실행: prompts ${prompts.length}개 × fixtures ${fixtures.length}개 = ${prompts.length * fixtures.length}개\n`);

  const gitCommit = getGitCommit();
  const startedAt = new Date().toISOString();

  for (const p of prompts) {
    for (const fName of fixtures) {
      const key = `${p}__${fName}`;
      console.log(`▸ ${key}`);
      const fx: Fixture = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, `${fName}.json`), 'utf8'));
      try {
        const manse = await fetchManse(fx);
        const output = await runInterpret(p, fx, manse);
        const mdPath = path.join(CURRENT_DIR, `${key}.md`);
        const metaPath = path.join(CURRENT_DIR, `${key}.meta.json`);
        fs.writeFileSync(mdPath, output, 'utf8');
        fs.writeFileSync(metaPath, JSON.stringify({
          promptName: p, fixtureName: fName, tone: fx.tone ?? 'daily',
          timestamp: new Date().toISOString(), gitCommit,
          chars: output.length,
        }, null, 2));
      } catch (e) {
        console.error(`  ✖ ${(e as Error).message}`);
      }
    }
  }

  // run.json — 이번 실행 메타 (브랜치, 커밋, 시작/끝 시간)
  fs.writeFileSync(path.join(CURRENT_DIR, 'run.json'), JSON.stringify({
    startedAt, finishedAt: new Date().toISOString(),
    gitCommit, prompts, fixtures,
  }, null, 2));

  console.log(`\n✓ 완료. 결과 위치: outputs/current/`);
  console.log(`  diff 보기: npm run view`);
}

main().catch((e) => { console.error(e); process.exit(1); });
