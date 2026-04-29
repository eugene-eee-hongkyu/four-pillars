// outputs/current/ vs outputs/keepers/ diff 웹뷰어
//
// 사용법:
//   npm run view              # 자동으로 빈 포트에 서버 띄우고 브라우저 오픈
//   npm run view -- --port 4000

import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { createTwoFilesPatch } from 'diff';
// @ts-expect-error — diff2html 타입 미흡
import { html as diff2html } from 'diff2html';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CURRENT_DIR = path.join(ROOT, 'outputs', 'current');
const KEEPERS_DIR = path.join(ROOT, 'outputs', 'keepers');

interface Entry {
  key: string;
  hasCurrent: boolean;
  hasKeeper: boolean;
  current?: string;
  keeper?: string;
  meta?: unknown;
}

function listEntries(): Entry[] {
  const keys = new Set<string>();
  if (fs.existsSync(CURRENT_DIR)) {
    fs.readdirSync(CURRENT_DIR)
      .filter(f => f.endsWith('.md'))
      .forEach(f => keys.add(f.replace(/\.md$/, '')));
  }
  if (fs.existsSync(KEEPERS_DIR)) {
    fs.readdirSync(KEEPERS_DIR)
      .filter(f => f.endsWith('.md'))
      .forEach(f => keys.add(f.replace(/\.md$/, '')));
  }
  return [...keys].sort().map(key => {
    const cur = path.join(CURRENT_DIR, `${key}.md`);
    const kpr = path.join(KEEPERS_DIR, `${key}.md`);
    const metaPath = path.join(CURRENT_DIR, `${key}.meta.json`);
    return {
      key,
      hasCurrent: fs.existsSync(cur),
      hasKeeper: fs.existsSync(kpr),
      current: fs.existsSync(cur) ? fs.readFileSync(cur, 'utf8') : undefined,
      keeper: fs.existsSync(kpr) ? fs.readFileSync(kpr, 'utf8') : undefined,
      meta: fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : undefined,
    };
  });
}

function buildDiffHtml(entry: Entry, format: 'side-by-side' | 'line-by-line'): string {
  if (!entry.hasCurrent) {
    return `<div class="empty">현재 결과 없음 — npm run test 실행 필요</div>`;
  }
  if (!entry.hasKeeper) {
    return `<div class="no-keeper">
      <div class="no-keeper-header">키퍼 없음 — 현재 결과만 표시</div>
      <pre>${escapeHtml(entry.current!)}</pre>
      <div class="hint">이 결과를 기준으로 삼으려면: <code>npm run promote -- --prompt {p} --fixture {f}</code></div>
    </div>`.replace('{p}', entry.key.split('__')[0]).replace('{f}', entry.key.split('__')[1]);
  }
  const patch = createTwoFilesPatch(
    `keepers/${entry.key}.md`,
    `current/${entry.key}.md`,
    entry.keeper!,
    entry.current!,
  );
  return diff2html(patch, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: format,
  }) as string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function buildIndexHtml(entries: Entry[]): string {
  const items = entries.map((e, i) => {
    const status = e.hasKeeper && e.hasCurrent ? '🟢' : !e.hasKeeper ? '⚪' : '⚠';
    return `<li><a href="#" data-idx="${i}">${status} ${escapeHtml(e.key)}</a></li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>prompt_checker — diff viewer</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
<style>
  body { margin: 0; font-family: -apple-system, system-ui, sans-serif; color: #1a1a1a; }
  .layout { display: flex; height: 100vh; }
  aside { width: 280px; flex-shrink: 0; background: #f5f5f7; border-right: 1px solid #d2d2d7; overflow-y: auto; }
  aside h1 { font-size: 13px; padding: 16px 16px 8px; margin: 0; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.06em; }
  aside ul { list-style: none; padding: 0; margin: 0; }
  aside li a { display: block; padding: 10px 16px; color: #1a1a1a; text-decoration: none; font-size: 13px; border-bottom: 1px solid #e5e5e9; }
  aside li a:hover { background: #ebebef; }
  aside li a.active { background: #007aff; color: #fff; }
  main { flex: 1; overflow: auto; }
  .toolbar { padding: 10px 16px; border-bottom: 1px solid #d2d2d7; background: #fff; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
  .toolbar button { padding: 6px 12px; border: 1px solid #d2d2d7; background: #fff; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .toolbar button.active { background: #007aff; color: #fff; border-color: #007aff; }
  .content { padding: 16px; }
  .empty, .no-keeper { padding: 40px; text-align: center; color: #6e6e73; }
  .no-keeper { text-align: left; }
  .no-keeper-header { font-weight: 600; color: #ff9500; margin-bottom: 16px; }
  .no-keeper pre { background: #f5f5f7; padding: 16px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: 'SF Mono', Menlo, monospace; font-size: 13px; line-height: 1.6; }
  .hint { margin-top: 16px; color: #6e6e73; font-size: 13px; }
  .hint code { background: #f5f5f7; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .meta { font-size: 11px; color: #6e6e73; padding: 8px 16px; border-bottom: 1px solid #e5e5e9; background: #fafafa; }
</style>
</head>
<body>
<div class="layout">
  <aside>
    <h1>cases (${entries.length})</h1>
    <ul>${items}</ul>
  </aside>
  <main>
    <div class="toolbar">
      <button id="mode-side" class="active">좌우 비교</button>
      <button id="mode-line">한 줄 diff</button>
      <span style="margin-left: auto; font-size: 12px; color: #6e6e73;">🟢 keeper+current ⚪ keeper 없음 ⚠ current 없음</span>
    </div>
    <div id="meta" class="meta"></div>
    <div id="content" class="content"></div>
  </main>
</div>
<script>
  const entries = ${JSON.stringify(entries.map(e => ({
    key: e.key, hasCurrent: e.hasCurrent, hasKeeper: e.hasKeeper, meta: e.meta,
  })))};
  let currentIdx = 0;
  let mode = 'side-by-side';

  async function render() {
    const a = document.querySelectorAll('aside li a');
    a.forEach((el, i) => el.classList.toggle('active', i === currentIdx));
    const e = entries[currentIdx];
    if (!e) return;
    document.getElementById('meta').textContent = e.meta
      ? \`\${e.meta.promptName} / \${e.meta.fixtureName} · \${e.meta.timestamp} · git \${e.meta.gitCommit} · \${e.meta.chars}자\`
      : e.key;
    const res = await fetch(\`/diff?key=\${encodeURIComponent(e.key)}&format=\${mode}\`);
    document.getElementById('content').innerHTML = await res.text();
  }

  document.querySelectorAll('aside li a').forEach((el, i) => {
    el.addEventListener('click', (ev) => { ev.preventDefault(); currentIdx = i; render(); });
  });
  document.getElementById('mode-side').addEventListener('click', () => {
    mode = 'side-by-side';
    document.getElementById('mode-side').classList.add('active');
    document.getElementById('mode-line').classList.remove('active');
    render();
  });
  document.getElementById('mode-line').addEventListener('click', () => {
    mode = 'line-by-line';
    document.getElementById('mode-line').classList.add('active');
    document.getElementById('mode-side').classList.remove('active');
    render();
  });

  render();
</script>
</body>
</html>`;
}

function parsePort(): number {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--port');
  return idx >= 0 ? Number(args[idx + 1]) : 4321;
}

function openBrowser(url: string) {
  const cmd = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}

function main() {
  const port = parsePort();
  const entries = listEntries();
  if (entries.length === 0) {
    console.error('✖ outputs/ 비어있음. 먼저 npm run test 실행 필요.');
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:${port}`);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const fresh = listEntries(); // 매 새로고침마다 다시 읽음
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildIndexHtml(fresh));
      return;
    }
    if (url.pathname === '/diff') {
      const key = url.searchParams.get('key')!;
      const format = (url.searchParams.get('format') as 'side-by-side' | 'line-by-line') ?? 'side-by-side';
      const fresh = listEntries();
      const entry = fresh.find(e => e.key === key);
      if (!entry) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildDiffHtml(entry, format));
      return;
    }
    res.writeHead(404); res.end('not found');
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`✓ 뷰어: ${url}`);
    console.log(`  Ctrl+C 로 종료`);
    openBrowser(url);
  });
}

main();
