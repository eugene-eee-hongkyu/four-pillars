// 프롬프트 어드민 + diff 뷰어
// 한 페이지에서: 프롬프트 편집 → 저장+실행 → 진행 스트리밍 → diff → 키퍼로
//
// 사용법:
//   npm run view              # 자동으로 4321에 서버 + 브라우저 오픈
//   npm run view -- --port 4000

import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec, spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { createTwoFilesPatch } from 'diff';
import { html as diff2html } from 'diff2html';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SAJUTALK_DIR = path.resolve(ROOT, '..', 'sajutalk');
const SAJUTALK_PROMPTS_DIR = path.join(SAJUTALK_DIR, 'prompts');
const SAJUTALK_PORT = Number(process.env.SAJUTALK_PORT ?? 3002);
const SAJUTALK_URL = `http://localhost:${SAJUTALK_PORT}`;
const FIXTURES_DIR = path.join(ROOT, 'fixtures');
const CURRENT_DIR = path.join(ROOT, 'outputs', 'current');
const KEEPERS_DIR = path.join(ROOT, 'outputs', 'keepers');

// ─── sajutalk dev 서버 자동 기동 ──────────────────────────────
let sajutalkChild: ChildProcess | null = null;

async function checkSajutalkServer(): Promise<boolean> {
  try {
    const res = await fetch(SAJUTALK_URL + '/');
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureSajutalkServer(): Promise<void> {
  if (await checkSajutalkServer()) {
    console.log(`✓ sajutalk dev 서버 이미 실행 중 (${SAJUTALK_URL})`);
    return;
  }
  console.log(`▸ sajutalk dev 서버 기동 중...`);
  sajutalkChild = spawn('npm', ['run', 'dev', '--', '--port', String(SAJUTALK_PORT)], {
    cwd: SAJUTALK_DIR, stdio: ['ignore', 'pipe', 'pipe'],
  });
  sajutalkChild.stdout?.on('data', (d: Buffer) => {
    d.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`  [app] ${line}`);
    });
  });
  sajutalkChild.stderr?.on('data', (d: Buffer) => {
    d.toString().split('\n').forEach(line => {
      if (line.trim()) console.error(`  [app] ${line}`);
    });
  });

  // ready 대기 (최대 60초)
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkSajutalkServer()) {
      console.log(`✓ sajutalk dev 서버 준비 완료`);
      return;
    }
  }
  throw new Error('sajutalk dev 서버 기동 타임아웃 (60초)');
}

function shutdown() {
  if (sajutalkChild) {
    console.log('\n▸ sajutalk dev 서버 종료 중...');
    sajutalkChild.kill('SIGTERM');
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

interface Entry {
  key: string;
  hasCurrent: boolean;
  hasKeeper: boolean;
  current?: string;
  keeper?: string;
  meta?: unknown;
}

// ─── 헬퍼 ─────────────────────────────────────────────────────
function listPromptFiles(): string[] {
  if (!fs.existsSync(SAJUTALK_PROMPTS_DIR)) return [];
  return fs.readdirSync(SAJUTALK_PROMPTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
    .sort();
}

function listFixtureFiles(): string[] {
  if (!fs.existsSync(FIXTURES_DIR)) return [];
  return fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

function readPrompt(name: string): string | null {
  const p = path.join(SAJUTALK_PROMPTS_DIR, `${name}.md`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function writePrompt(name: string, content: string): void {
  const p = path.join(SAJUTALK_PROMPTS_DIR, `${name}.md`);
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('잘못된 프롬프트 이름');
  fs.writeFileSync(p, content, 'utf8');
}

function listEntries(): Entry[] {
  const keys = new Set<string>();
  if (fs.existsSync(CURRENT_DIR)) {
    fs.readdirSync(CURRENT_DIR).filter(f => f.endsWith('.md')).forEach(f => keys.add(f.replace(/\.md$/, '')));
  }
  if (fs.existsSync(KEEPERS_DIR)) {
    fs.readdirSync(KEEPERS_DIR).filter(f => f.endsWith('.md')).forEach(f => keys.add(f.replace(/\.md$/, '')));
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

type ViewFormat = 'current-only' | 'side-by-side' | 'line-by-line';

// current-only 모드는 raw markdown 텍스트 반환 (브라우저에서 marked로 렌더링).
// side-by-side / line-by-line은 diff HTML 반환.
function buildViewContent(entry: Entry, format: ViewFormat): { contentType: string; body: string } {
  if (!entry.hasCurrent) {
    return { contentType: 'text/html; charset=utf-8', body: `<div class="empty">현재 결과 없음 — 실행 필요</div>` };
  }
  if (format === 'current-only') {
    return { contentType: 'text/plain; charset=utf-8', body: entry.current! };
  }
  if (!entry.hasKeeper) {
    return {
      contentType: 'text/html; charset=utf-8',
      body: `<div class="no-keeper">
        <div class="no-keeper-header">키퍼 없음 — 현재 결과만 표시</div>
        <pre>${escapeHtml(entry.current!)}</pre>
        <div class="hint">이 결과를 기준으로 삼으려면 위의 [🟢 키퍼로] 버튼 클릭.</div>
      </div>`,
    };
  }
  const patch = createTwoFilesPatch(
    `keepers/${entry.key}.md`,
    `current/${entry.key}.md`,
    entry.keeper!,
    entry.current!,
  );
  const html = diff2html(patch, { drawFileList: false, matching: 'lines', outputFormat: format }) as string;
  return { contentType: 'text/html; charset=utf-8', body: html };
}

function promotePair(key: string): boolean {
  const md = path.join(CURRENT_DIR, `${key}.md`);
  const meta = path.join(CURRENT_DIR, `${key}.meta.json`);
  if (!fs.existsSync(md)) return false;
  fs.mkdirSync(KEEPERS_DIR, { recursive: true });
  fs.copyFileSync(md, path.join(KEEPERS_DIR, `${key}.md`));
  if (fs.existsSync(meta)) fs.copyFileSync(meta, path.join(KEEPERS_DIR, `${key}.meta.json`));
  return true;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ─── HTML ─────────────────────────────────────────────────────
function buildIndexHtml(): string {
  const prompts = listPromptFiles();
  const fixtures = listFixtureFiles();
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>prompt_checker</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, system-ui, sans-serif; color: #1a1a1a; background: #f5f5f7; }
  header { background: #fff; border-bottom: 1px solid #d2d2d7; padding: 12px 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; }
  header h1 { font-size: 14px; margin: 0; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.06em; }
  header select, header input { padding: 6px 10px; border: 1px solid #d2d2d7; border-radius: 6px; font-size: 13px; background: #fff; }
  header button { padding: 7px 14px; border: 1px solid #d2d2d7; background: #fff; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 120ms; }
  header button:hover { background: #f0f0f3; }
  header button.primary { background: #007aff; color: #fff; border-color: #007aff; }
  header button.primary:hover { background: #0056cc; }
  header button:disabled { opacity: 0.4; cursor: not-allowed; }
  header .spacer { flex: 1; }
  main { padding: 16px 20px; max-width: 1400px; margin: 0 auto; }
  .panel { background: #fff; border: 1px solid #d2d2d7; border-radius: 10px; margin-bottom: 16px; overflow: hidden; }
  .panel-header { padding: 10px 16px; border-bottom: 1px solid #e5e5e9; font-size: 13px; font-weight: 600; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
  .panel-header .muted { font-weight: 400; color: #6e6e73; font-size: 12px; }
  .panel-body { padding: 16px; }
  textarea#editor { width: 100%; min-height: 380px; font-family: 'SF Mono', Menlo, monospace; font-size: 13px; line-height: 1.6; padding: 12px; border: 1px solid #e5e5e9; border-radius: 6px; resize: vertical; outline: none; }
  textarea#editor:focus { border-color: #007aff; }
  #progress { font-family: 'SF Mono', Menlo, monospace; font-size: 12px; padding: 12px 16px; background: #1a1a1a; color: #a8d8a8; min-height: 60px; max-height: 240px; overflow-y: auto; overflow-x: hidden; border-radius: 6px; white-space: pre-wrap; word-break: break-all; overflow-wrap: anywhere; }
  #progress.hidden { display: none; }
  .case-tabs { display: flex; gap: 4px; padding: 0 16px; border-bottom: 1px solid #e5e5e9; flex-wrap: wrap; background: #fafafa; }
  .case-tabs button { padding: 8px 14px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: #6e6e73; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .case-tabs button.active { color: #007aff; border-bottom-color: #007aff; font-weight: 500; }
  .case-tabs button:hover { color: #1a1a1a; }
  .case-toolbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fafafa; border-bottom: 1px solid #e5e5e9; }
  .case-toolbar .meta { font-size: 11px; color: #6e6e73; flex: 1; }
  .case-toolbar button { padding: 5px 10px; border: 1px solid #d2d2d7; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .case-toolbar button:hover { background: #f0f0f3; }
  .case-toolbar button.active { background: #007aff; color: #fff; border-color: #007aff; }
  .case-toolbar button.promote { background: #34c759; color: #fff; border-color: #34c759; }
  .case-toolbar button.promote:hover { background: #2aa84a; }
  #diff { padding: 16px; min-height: 200px; max-height: 70vh; overflow: auto; }
  .md-render { font-size: 14px; line-height: 1.7; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
  .md-render h1 { font-size: 22px; margin: 24px 0 12px; }
  .md-render h2 { font-size: 18px; margin: 22px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e9; }
  .md-render h3 { font-size: 15px; margin: 18px 0 8px; }
  .md-render p { margin: 8px 0 14px; }
  .md-render ul, .md-render ol { margin: 8px 0 14px; padding-left: 24px; }
  .md-render li { margin: 4px 0; }
  .md-render hr { border: none; border-top: 1px solid #e5e5e9; margin: 20px 0; }
  .md-render strong { color: #1a1a1a; font-weight: 600; }
  .md-render code { background: #f5f5f7; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  .md-render table { border-collapse: collapse; margin: 12px 0; width: 100%; font-size: 13px; }
  .md-render th, .md-render td { border: 1px solid #d2d2d7; padding: 8px 12px; text-align: left; }
  .md-render th { background: #f5f5f7; font-weight: 600; }
  .empty, .no-keeper { padding: 40px; text-align: center; color: #6e6e73; }
  .no-keeper { text-align: left; }
  .no-keeper-header { font-weight: 600; color: #ff9500; margin-bottom: 16px; }
  .no-keeper pre { background: #f5f5f7; padding: 16px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: 'SF Mono', Menlo, monospace; font-size: 13px; line-height: 1.6; max-height: 50vh; overflow-y: auto; }
  .hint { margin-top: 16px; color: #6e6e73; font-size: 13px; }
  .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; background: #1a1a1a; color: #fff; border-radius: 8px; font-size: 13px; opacity: 0; transition: opacity 220ms; pointer-events: none; z-index: 200; }
  .toast.show { opacity: 1; }
  .toast.success { background: #34c759; }
  .toast.error { background: #ff3b30; }
</style>
</head>
<body>
<header>
  <h1>prompt_checker</h1>
  <select id="prompt-select"></select>
  <span style="color:#6e6e73;font-size:12px;">×</span>
  <select id="fixture-select">
    <option value="">전체 fixture</option>
  </select>
  <span class="spacer"></span>
  <button id="btn-save">💾 저장</button>
  <button id="btn-run" class="primary">▶ 저장 후 실행</button>
</header>

<main>
  <div class="panel">
    <div class="panel-header">
      <span>프롬프트 편집</span>
      <span class="muted" id="prompt-path"></span>
    </div>
    <div class="panel-body">
      <textarea id="editor" placeholder="프롬프트 로딩 중..."></textarea>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">실행 진행</div>
    <pre id="progress" class="hidden"></pre>
  </div>

  <div class="panel">
    <div class="panel-header">결과 비교 (keeper ↔ current)</div>
    <div class="case-tabs" id="case-tabs"></div>
    <div class="case-toolbar" id="case-toolbar" style="display:none;">
      <span class="meta" id="case-meta"></span>
      <button id="btn-promote" class="promote">🟢 이 결과를 키퍼로</button>
      <button id="btn-current" class="active">결과만</button>
      <button id="btn-side">좌우 비교</button>
      <button id="btn-line">한 줄 diff</button>
    </div>
    <div id="diff"><div class="empty">아직 실행한 결과가 없습니다 — 위에서 [▶ 저장 후 실행]을 눌러주세요.</div></div>
  </div>
</main>

<div class="toast" id="toast"></div>

<script>
const PROMPTS = ${JSON.stringify(prompts)};
const FIXTURES = ${JSON.stringify(fixtures)};
let entries = [];
let currentPromptName = PROMPTS[0] || '';
let currentCaseIdx = 0;
let diffMode = 'current-only';
let originalContent = '';

function $(id) { return document.getElementById(id); }
function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(() => { t.className = 'toast ' + (type || ''); }, 2200);
}

// 프롬프트 select 채우기
const promptSel = $('prompt-select');
PROMPTS.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p; opt.textContent = p;
  promptSel.appendChild(opt);
});
promptSel.value = currentPromptName;

// fixture select 채우기
const fixSel = $('fixture-select');
FIXTURES.forEach(f => {
  const opt = document.createElement('option');
  opt.value = f; opt.textContent = f;
  fixSel.appendChild(opt);
});

async function loadPrompt(name) {
  const res = await fetch('/api/prompt?name=' + encodeURIComponent(name));
  if (!res.ok) { toast('프롬프트 로드 실패', 'error'); return; }
  const data = await res.json();
  $('editor').value = data.content;
  $('prompt-path').textContent = 'sajutalk/prompts/' + name + '.md';
  originalContent = data.content;
  currentPromptName = name;
}

async function refreshEntries() {
  const res = await fetch('/api/entries');
  entries = await res.json();
  renderTabs();
}

function renderTabs() {
  const tabs = $('case-tabs');
  // 현재 프롬프트 + 선택된 fixture에 해당하는 항목만 필터
  const filtered = entries.filter(e => e.key.startsWith(currentPromptName + '__'));
  tabs.innerHTML = '';
  if (filtered.length === 0) {
    $('case-toolbar').style.display = 'none';
    $('diff').innerHTML = '<div class="empty">아직 실행한 결과가 없습니다 — 위에서 [▶ 저장 후 실행]을 눌러주세요.</div>';
    return;
  }
  filtered.forEach((e, i) => {
    const btn = document.createElement('button');
    const status = e.hasKeeper && e.hasCurrent ? '🟢' : !e.hasKeeper ? '⚪' : '⚠';
    btn.textContent = status + ' ' + e.key.replace(currentPromptName + '__', '');
    btn.className = (i === currentCaseIdx) ? 'active' : '';
    btn.addEventListener('click', () => { currentCaseIdx = i; renderDiff(); });
    tabs.appendChild(btn);
  });
  if (currentCaseIdx >= filtered.length) currentCaseIdx = 0;
  renderDiff();
}

async function renderDiff() {
  const filtered = entries.filter(e => e.key.startsWith(currentPromptName + '__'));
  const e = filtered[currentCaseIdx];
  if (!e) return;
  $('case-toolbar').style.display = 'flex';
  $('case-meta').textContent = e.meta
    ? \`\${e.meta.fixtureName} · \${e.meta.timestamp} · git \${e.meta.gitCommit} · \${e.meta.chars}자\`
    : e.key;
  $('btn-promote').disabled = !e.hasCurrent;
  Array.from($('case-tabs').children).forEach((el, i) => el.classList.toggle('active', i === currentCaseIdx));
  const res = await fetch('/api/diff?key=' + encodeURIComponent(e.key) + '&format=' + diffMode);
  const text = await res.text();
  if (diffMode === 'current-only') {
    // raw markdown → marked로 렌더링
    $('diff').innerHTML = '<div class="md-render">' + (window.marked ? window.marked.parse(text) : text) + '</div>';
  } else {
    $('diff').innerHTML = text;
  }
}

// 이벤트
promptSel.addEventListener('change', () => loadPrompt(promptSel.value).then(refreshEntries));

$('btn-save').addEventListener('click', async () => {
  const content = $('editor').value;
  const res = await fetch('/api/prompt', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: currentPromptName, content }),
  });
  if (res.ok) { originalContent = content; toast('저장 완료', 'success'); }
  else toast('저장 실패', 'error');
});

$('btn-run').addEventListener('click', async () => {
  // 자동 저장
  const content = $('editor').value;
  if (content !== originalContent) {
    const saveRes = await fetch('/api/prompt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: currentPromptName, content }),
    });
    if (!saveRes.ok) { toast('저장 실패', 'error'); return; }
    originalContent = content;
  }

  // 실행 (SSE)
  $('btn-run').disabled = true;
  $('btn-save').disabled = true;
  const progress = $('progress');
  progress.classList.remove('hidden');
  progress.textContent = '';
  const fixture = fixSel.value;
  const url = '/api/run?prompt=' + encodeURIComponent(currentPromptName) + (fixture ? '&fixture=' + encodeURIComponent(fixture) : '');
  const evt = new EventSource(url);
  evt.onmessage = (e) => {
    // SSE는 다중 라인 data를 \\n으로 합쳐서 e.data로 전달함.
    // 자식 프로세스가 . 만 쓴 경우 e.data === '.' → 현재 줄에 누적.
    // newline 포함 (예: '완료\\n')은 그대로 보존.
    progress.textContent += e.data;
    progress.scrollTop = progress.scrollHeight;
  };
  evt.addEventListener('done', async () => {
    evt.close();
    $('btn-run').disabled = false;
    $('btn-save').disabled = false;
    toast('실행 완료', 'success');
    await refreshEntries();
  });
  evt.addEventListener('error', () => {
    evt.close();
    $('btn-run').disabled = false;
    $('btn-save').disabled = false;
    toast('실행 오류 — dev 서버 확인', 'error');
  });
});

$('btn-promote').addEventListener('click', async () => {
  const filtered = entries.filter(e => e.key.startsWith(currentPromptName + '__'));
  const e = filtered[currentCaseIdx];
  if (!e) return;
  const res = await fetch('/api/promote', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: e.key }),
  });
  if (res.ok) { toast('키퍼 갱신', 'success'); await refreshEntries(); }
  else toast('키퍼 저장 실패', 'error');
});

function setMode(newMode) {
  diffMode = newMode;
  ['btn-current', 'btn-side', 'btn-line'].forEach(id => $(id).classList.remove('active'));
  const map = { 'current-only': 'btn-current', 'side-by-side': 'btn-side', 'line-by-line': 'btn-line' };
  $(map[newMode]).classList.add('active');
  renderDiff();
}
$('btn-current').addEventListener('click', () => setMode('current-only'));
$('btn-side').addEventListener('click', () => setMode('side-by-side'));
$('btn-line').addEventListener('click', () => setMode('line-by-line'));

// 초기 로드
loadPrompt(currentPromptName).then(refreshEntries);
</script>
</body>
</html>`;
}

// ─── 실행 (SSE) ───────────────────────────────────────────────
function streamRun(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url!, 'http://localhost');
  const prompt = url.searchParams.get('prompt');
  const fixture = url.searchParams.get('fixture');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const args = ['scripts/test.ts'];
  if (prompt) args.push('--prompt', prompt);
  if (fixture) args.push('--fixture', fixture);
  const child = spawn('npx', ['tsx', ...args], { cwd: ROOT, env: process.env });

  // 자식 프로세스 stdout/stderr 청크를 그대로 SSE로 forward.
  // chunk 내 newline은 SSE multi-line `data:` 인코딩으로 보존 → 브라우저가 원본 그대로 누적.
  // (점 한 줄에 . 누적되는 형태 유지)
  const sendRaw = (chunk: string) => {
    if (!chunk) return;
    const encoded = chunk.split('\n').map(l => `data: ${l}`).join('\n');
    res.write(encoded + '\n\n');
  };

  child.stdout.on('data', (data: Buffer) => sendRaw(data.toString('utf8')));
  child.stderr.on('data', (data: Buffer) => {
    // stderr는 줄별로 [err] prefix
    const text = data.toString('utf8');
    const prefixed = text.split('\n').map(l => l ? `[err] ${l}` : l).join('\n');
    sendRaw(prefixed);
  });
  child.on('close', (code) => {
    sendRaw(`\n(종료 코드: ${code ?? '?'})\n`);
    res.write('event: done\ndata: ok\n\n');
    res.end();
  });
}

// ─── 라우터 ───────────────────────────────────────────────────
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

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function main() {
  await ensureSajutalkServer();
  const port = parsePort();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://localhost:${port}`);
    const method = req.method ?? 'GET';

    try {
      // 메인 페이지
      if (method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildIndexHtml());
        return;
      }

      // 프롬프트 읽기
      if (method === 'GET' && url.pathname === '/api/prompt') {
        const name = url.searchParams.get('name')!;
        const content = readPrompt(name);
        if (content === null) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name, content }));
        return;
      }

      // 프롬프트 저장
      if (method === 'POST' && url.pathname === '/api/prompt') {
        const body = JSON.parse(await readBody(req));
        writePrompt(body.name, body.content);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // entries 목록
      if (method === 'GET' && url.pathname === '/api/entries') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(listEntries().map(e => ({
          key: e.key, hasCurrent: e.hasCurrent, hasKeeper: e.hasKeeper, meta: e.meta,
        }))));
        return;
      }

      // 결과 콘텐츠 (current-only / side-by-side / line-by-line)
      if (method === 'GET' && url.pathname === '/api/diff') {
        const key = url.searchParams.get('key')!;
        const format = (url.searchParams.get('format') as ViewFormat) ?? 'current-only';
        const entry = listEntries().find(e => e.key === key);
        if (!entry) { res.writeHead(404); res.end('not found'); return; }
        const { contentType, body } = buildViewContent(entry, format);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(body);
        return;
      }

      // 실행 (SSE)
      if (method === 'GET' && url.pathname === '/api/run') {
        streamRun(req, res);
        return;
      }

      // 키퍼로 promote
      if (method === 'POST' && url.pathname === '/api/promote') {
        const body = JSON.parse(await readBody(req));
        const ok = promotePair(body.key);
        res.writeHead(ok ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok }));
        return;
      }

      res.writeHead(404); res.end('not found');
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`✓ 어드민: ${url}`);
    console.log(`  Ctrl+C 로 종료`);
    openBrowser(url);
  });
}

main().catch((e) => { console.error(e); shutdown(); });
