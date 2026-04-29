// outputs/current/{prompt}__{fixture}.md → outputs/keepers/ 복사
//
// 사용법:
//   npm run promote -- --prompt interpret-daily --fixture leehonggyu
//   npm run promote -- --all                       # current 전체를 keepers로 (위험)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CURRENT_DIR = path.join(ROOT, 'outputs', 'current');
const KEEPERS_DIR = path.join(ROOT, 'outputs', 'keepers');

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { prompt?: string; fixture?: string; all?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt') out.prompt = args[++i];
    else if (args[i] === '--fixture') out.fixture = args[++i];
    else if (args[i] === '--all') out.all = true;
  }
  return out;
}

function copyPair(key: string) {
  const md = path.join(CURRENT_DIR, `${key}.md`);
  const meta = path.join(CURRENT_DIR, `${key}.meta.json`);
  if (!fs.existsSync(md)) {
    console.error(`✖ 없음: ${md}`);
    return false;
  }
  fs.mkdirSync(KEEPERS_DIR, { recursive: true });
  fs.copyFileSync(md, path.join(KEEPERS_DIR, `${key}.md`));
  if (fs.existsSync(meta)) fs.copyFileSync(meta, path.join(KEEPERS_DIR, `${key}.meta.json`));
  console.log(`✓ ${key} → keepers/`);
  return true;
}

function main() {
  const { prompt, fixture, all } = parseArgs();

  if (!fs.existsSync(CURRENT_DIR)) {
    console.error(`✖ current 디렉토리 없음. 먼저 npm run test 실행 필요.`);
    process.exit(1);
  }

  if (all) {
    const files = fs.readdirSync(CURRENT_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) copyPair(f.replace(/\.md$/, ''));
    return;
  }

  if (!prompt || !fixture) {
    console.error('✖ --prompt 와 --fixture 둘 다 지정 필요 (또는 --all)');
    console.error('  예: npm run promote -- --prompt interpret-daily --fixture leehonggyu');
    process.exit(1);
  }

  if (!copyPair(`${prompt}__${fixture}`)) process.exit(1);
}

main();
