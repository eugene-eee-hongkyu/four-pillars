# e2e Playbook — eduluck prod 검증

> 사용자가 "e2e 검증", "playbook 따라", "prod 검증" 등 요청 시 이 문서 따른다.
> 최초 작성: 2026-05-28. 검증 10종 + 정리. 약 10-12분 + Anthropic 비용 약 $0.20.

## 언제 실행

1. 코드 변경 push 후 Vercel deploy 완료 시점
2. prod 배포 직후 사용자가 명시 요청 시
3. 보안·정확성 audit fix 의 활성 확인 필요 시

## 사전 준비

### 1. Vercel deploy 상태 확인
```
mcp__vercel__list_deployments(projectId=prj_wm80uin0FXyboG0cdUN092Tb58Dr, teamId=team_kmaXnRn38PY8v0Q6C3F2xNP4)
```
- 최신 deployment state = READY 확인
- githubCommitSha = 현재 HEAD 일치 확인
- BUILDING 이면 90초 단위 polling (보통 1-3분 소요)

### 2. prod URL
- 기본: `https://luck.z21labs.world`
- 대체 (SG ISP 차단 등): `https://four-pillars-alpha.vercel.app`

### 3. 사용 도구 (모두 활성 확인)
- `mcp__playwright__browser_*` — UI 조작
- `mcp__supabase__execute_sql` (project_id=`hqtletafqlwphhakoyrm`) — DB 검증
- `mcp__vercel__list_deployments`, `get_deployment` — deploy 추적

## 검증 5종 (순서대로)

### 검증 1 — feedback UNIQUE constraint (SQL 직접, 즉시)

```sql
-- 1a. 임시 test session 생성
INSERT INTO public.sessions (id, expires_at, device_id)
VALUES ('00000000-0000-0000-0000-000000000099'::uuid, now() + interval '1 day', 'test-device-x')
ON CONFLICT (id) DO NOTHING;

-- 1b. 첫번째 row insert (premium-part2)
INSERT INTO public.feedback_responses (session_id, source, q2_hagun_accuracy)
VALUES ('00000000-0000-0000-0000-000000000099'::uuid, 'premium-part2', 5)
RETURNING id, source;
```
**기대**: 200 OK + row id 반환.

```sql
-- 1c. 같은 (session_id, source) 두번째 insert
INSERT INTO public.feedback_responses (session_id, source, q2_hagun_accuracy)
VALUES ('00000000-0000-0000-0000-000000000099'::uuid, 'premium-part2', 3);
```
**기대**: **ERROR 23505 unique constraint violation** `feedback_responses_session_source_uniq`.

```sql
-- 1d. 다른 source (deep-dive) 별도 row 허용 확인
INSERT INTO public.feedback_responses (session_id, source, q2_hagun_accuracy)
VALUES ('00000000-0000-0000-0000-000000000099'::uuid, 'deep-dive', 4)
RETURNING id, source;

-- 1e. 정리 (CASCADE)
DELETE FROM public.sessions WHERE id = '00000000-0000-0000-0000-000000000099'::uuid;
```

### 검증 2 — 실제 진단 흐름 (Playwright + LLM, 약 6분)

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
mcp__playwright__browser_evaluate(function="() => { localStorage.clear(); return {cleared:true} }")
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")  # localStorage clear 반영
mcp__playwright__browser_snapshot(depth=3)
```

**기대 랜딩**: VersionFooter `v5.X.XXXX · <sha>` 새 commit sha, "무료 진단 시작" CTA.

```
mcp__playwright__browser_click(target=<무료진단 버튼 ref>)
```

family-input 도착. 자녀 정보 fill:
- 닉네임: "테스트"
- 성별: 남
- 학년: 대학생 / 성인 (회고용) — 빠른 흐름 위해 high-3 권장
- 양력
- 생년월일: `2008-01-01` (date textbox)
- 출생 시간: `12:00` (time textbox)
- 출생 지역: 서울

```
mcp__playwright__browser_click(target=<가족 만세력 보기 ref>)
mcp__playwright__browser_click(target=<정밀 진단 받기 ref>)
```

interpret-premium 진입. Part 1 SSE 시작. Polling 으로 완료 대기:
```js
// Part 1 완료 polling
async () => {
  const maxMs = 6 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const text = document.body.innerText;
    if (text.includes('더 자세한 진로·미래 보기')) {
      return { done: 'part1_complete', elapsedMs: Date.now() - start };
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  return { done: false };
}
```

Part 2 prefetch (5초 delay 후 백그라운드 SSE):
```js
// Part 2 완료 polling — deep-dive 또는 feedback CTA 등장
async () => {
  const maxMs = 6 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const text = document.body.innerText;
    if (text.includes('더 자세히 알고 싶은 영역 선택') || text.includes('한 줄 피드백')) {
      return { done: 'part2_complete', elapsedMs: Date.now() - start, bodyLen: text.length };
    }
    await new Promise(r => setTimeout(r, 15000));
  }
}
```

### 검증 3 — interpretations row DB 검증

sessionId 추출:
```js
() => {
  const s = JSON.parse(localStorage.getItem('eduluck.flow.state') || '{}');
  return { sessionId: s.sessionId, deviceId: localStorage.getItem('eduluck.device.id') };
}
```

```sql
-- 3a. interpretations 의 같은 sessionId·kind 중복 검사 (BUG A·E·F)
SELECT kind, count(*) AS row_count, max(prompt_version) AS prompt_version
FROM public.interpretations
WHERE session_id = '<sessionId>'
GROUP BY kind;
```
**기대**: 
- `premium-part1` row_count = **1**
- `premium-part2` row_count = **1**
- prompt_version = **`v5.25-global-abroad-synonym`** (또는 현재 PREMIUM_PROMPT_VERSION)
- → BUG A·B fix 활성 확인

```sql
-- 3b. sessions 의 device_id + llm_call_count
SELECT id, device_id, llm_call_count FROM public.sessions WHERE id = '<sessionId>';
```
**기대**:
- `device_id` = client localStorage 의 deviceId 정확 일치
- `llm_call_count` = 2 (Part1 + Part2 prefetch)
- → DD3.B + DH3.A 활성 확인

```sql
-- 3c. subjects.nickname sanitize
SELECT nickname, gender, grade FROM public.subjects WHERE session_id = '<sessionId>';
```
**기대**: 입력한 nickname 그대로 (특수문자 차단 입력은 sanitize 됨).

### 검증 4 — history 카드 복원 (cached state + LLM ✗)

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
```

```
mcp__playwright__browser_snapshot(depth=5)
```
**기대**: "📂 이전에 본 진단" 헤더 + 자녀 카드 + "🆕 다른 자녀 무료 진단" CTA.

Network 가로채기 + 카드 클릭:
```js
// fetch 가로채기
() => {
  window.__llmCalls = 0;
  window.__origFetch = window.fetch;
  window.fetch = function(...args) {
    if (typeof args[0] === 'string' && /\/api\/(interpret-|relation-mini)/.test(args[0])) {
      window.__llmCalls++;
    }
    return window.__origFetch.apply(this, args);
  };
  return { instrumented: true };
}
```

```
mcp__playwright__browser_click(target=<history 카드 ref>)
```

5초 대기 + 검증:
```js
async () => {
  await new Promise(r => setTimeout(r, 5000));
  const text = document.body.innerText;
  return {
    llm_api_calls: window.__llmCalls,
    bodyLen: text.length,
    cached_visible: text.length > 5000,
  };
}
```
**기대**: `llm_api_calls = 0`, bodyLen 큰 값 (cached Part1+Part2 표시).

```sql
-- llm_call_count 변경 없음 확인
SELECT llm_call_count FROM public.sessions WHERE id = '<sessionId>';
```
**기대**: 검증 3b 와 동일 (증가 ✗) — BUG 3·5 fix + 캐시 정책 정상.

### 검증 5 — feedback 재제출 409

```js
async () => {
  const sessionId = '<sessionId>';
  const deviceId = '<deviceId>';
  const body = { sessionId, deviceId, source: 'premium-part2', q2HagunAccuracy: 5 };

  const first = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const second = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, q2HagunAccuracy: 3 }),
  });
  const third = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, source: 'deep-dive' }),
  });
  return {
    first: { status: first.status },
    second_duplicate: { status: second.status, body: await second.json() },
    third_diff_source: { status: third.status },
  };
}
```
**기대**:
- `first.status = 200`
- `second_duplicate.status = 409`, `body.error = "already submitted for this session/source"`
- `third_diff_source.status = 200` (다른 source 별도 row 허용)

### 검증 6 — paywall 트리거 1 (새 자녀 진단)

옵션 가: 첫 자녀 무료 + 이미 1자녀 + 비회원 → 새 자녀 시도 시 PaywallModal 노출.

전제: 비회원 상태에서 검증 2~5 가 끝나 `sessionsHistory.length >= 1` 인 localStorage.

```js
// localStorage 확인 — sessionsHistory + user 상태
() => {
  const flow = JSON.parse(localStorage.getItem('eduluck.flow.state') || '{}');
  return {
    historyCount: (flow.sessionsHistory || []).length,
    hasUser: !!Object.keys(localStorage).find(k => k.startsWith('sb-') && k.includes('auth-token')),
  };
}
```
**기대**: `historyCount >= 1`, `hasUser = false` (비회원).

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
mcp__playwright__browser_snapshot(depth=3)
```

**기대 랜딩**: 상단 닉네임·로그아웃 배지 ✗ (비회원). StickyCTA 텍스트 = "🔒 다른 자녀 진단 (로그인 필요)".

```
mcp__playwright__browser_click(target=<🔒 다른 자녀 진단 버튼 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대 모달**: "🌱 다른 자녀도 보시려면" 헤더 + "첫 번째 자녀 진단은 무료예요..." 본문 + "💬 카카오로 로그인" 버튼 + "나중에 할게요" 버튼.

### 검증 7 — 카카오 OAuth redirect 시작

```js
// 클릭 후 카카오 OAuth URL 로 redirect 시작되는지 + 콘솔 에러 캡처
async () => {
  window.__urlChanges = [window.location.href];
  window.__consoleErrors = [];
  const origErr = console.error;
  console.error = (...args) => {
    window.__consoleErrors.push(args.join(' '));
    origErr.apply(console, args);
  };
  return { instrumented: true };
}
```

```
mcp__playwright__browser_click(target=<카카오로 로그인 버튼 ref>)
mcp__playwright__browser_wait_for(time=3)
mcp__playwright__browser_evaluate(function="() => ({ url: window.location.href, errors: window.__consoleErrors || [] })")
```

**기대**:
- `url` 이 `kauth.kakao.com/oauth/authorize?...` 로 시작 — Supabase 가 카카오 OAuth URL 로 redirect 성공
- 또는 Supabase Redirect URLs 미설정 시 `errors` 에 "redirect_to URL not allowed" 같은 메시지 노출 (이 경우 사용자에게 Supabase 콘솔 설정 안내)
- 데스크탑 브라우저는 카카오 ID/PW 페이지로 분기 (모바일은 카카오톡 앱 deeplink 자동)

### 검증 8 — /auth/callback 라우트 작동

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/auth/callback")
mcp__playwright__browser_wait_for(time=2)
mcp__playwright__browser_snapshot(depth=2)
```

**기대**: "로그인 처리 중..." 로딩 화면 (ActivityIndicator). 5초 후 자동 홈 redirect.

```
mcp__playwright__browser_wait_for(time=6)
mcp__playwright__browser_evaluate(function="() => ({ url: window.location.href })")
```

**기대**: `url` 끝이 `/` (홈) — 안전망 timeout 으로 redirect.

### 검증 9 — paywall 트리거 2 (deep-dive 영역 추가)

옵션 가: 첫 영역 무료 + 이미 1개 봤음 + 비회원 → 새 영역 시도 시 PaywallModal 노출.

전제: 검증 2 흐름의 sessionId 에서 deepDiveTexts 에 가짜 1개 주입 (또는 검증 2 후 실제 deep-dive 1회 수행).

```js
// 가짜 deepDiveTexts 1개 주입 (테스트용 단축)
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  s.deepDiveTexts = { ...(s.deepDiveTexts || {}), '5': '[테스트용 캐시 본문]' };
  localStorage.setItem(key, JSON.stringify(s));
  return { injected: Object.keys(s.deepDiveTexts) };
}
```

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/interpret-deep-select")
mcp__playwright__browser_snapshot(depth=4)
```

**기대**: 안내 문구 = "첫 번째 영역은 무료, 다른 영역은 카카오 로그인 후 보실 수 있어요." + section 5 카드는 "✓ 본 적 있음" + 나머지 카드는 "🔒" + 흐릿한 opacity.

```
mcp__playwright__browser_click(target=<section 5 카드 ref>)  # 본 영역 자유 진입 확인
mcp__playwright__browser_navigate_back()
mcp__playwright__browser_click(target=<다른 section 카드 ref>)  # 새 영역 시도
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: PaywallModal "🔎 다른 영역도 보시려면" + "💬 카카오로 로그인" 버튼.

```js
// 정리 — 주입한 가짜 deepDiveTexts 제거
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  delete (s.deepDiveTexts || {})['5'];
  localStorage.setItem(key, JSON.stringify(s));
  return { restored: true };
}
```

### 검증 10 — Mixpanel 이벤트 인입

```
mcp__mixpanel__Run-Query(
  project_id=4028508,
  report_type="insights",
  report={
    "name": "auth events last hour",
    "metrics": [
      {"eventName": "paywall_view", "measurement": {"type": "basic", "math": "total"}},
      {"eventName": "paywall_login_click", "measurement": {"type": "basic", "math": "total"}},
      {"eventName": "login_click", "measurement": {"type": "basic", "math": "total"}}
    ],
    "chartType": "table",
    "dateRange": {"type": "relative", "range": {"unit": "day", "value": 1}}
  }
)
```

**기대**: 검증 6·7·9 발사한 이벤트들 카운트 양수. trigger property breakdown 으로 `new_child` / `deepdive` 구분 확인 가능.

---

## 검증 11-16 — mom test 측정 인프라 (2026-05-30 추가)

> 신규 commit `2108d49` — Fake Door + PIPA 동의 + cap 도달 이벤트.
> 모든 검증은 페이지 로드 직후 **mixpanel spy** 를 심어 행동별 이벤트 발사 검증.

### Spy setup (검증 11-16 공통, 페이지 로드 후 즉시)

```js
() => {
  window.__captured = [];
  const orig = window.mixpanel?.track;
  if (!orig) return { error: 'mixpanel not initialized' };
  window.mixpanel.track = function (event, props) {
    window.__captured.push({ event, props, at: Date.now() });
    return orig.call(this, event, props);
  };
  return { ready: true };
}
```

### 검증 11 — PIPA 동의 미체크 시 진행 차단

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
mcp__playwright__browser_evaluate(function="() => { localStorage.clear(); return {cleared:true} }")
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
mcp__playwright__browser_click(target=<무료 진단 시작 ref>)
```

family-input 에 도착 → 자녀 정보 다 채우되 **법정대리인 동의 체크박스 미체크** 상태 유지.

```
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: "가족 만세력 보기" 버튼 `disabled` 상태 (회색·클릭 안 됨). 체크박스 라벨에 "법정대리인으로서 자녀 개인정보 처리에 동의 (필수)".

### 검증 12 — PIPA 동의 후 진행 + family_input_complete fire

체크박스 체크 → 버튼 활성. 클릭:

```
mcp__playwright__browser_click(target=<법정대리인 동의 체크박스 ref>)
mcp__playwright__browser_click(target=<가족 만세력 보기 ref>)
```

**기대**: child-manse 화면 진입. `window.__captured` 에 `family_input_complete` 포함.

```js
() => window.__captured.map(e => e.event)
// 기대: [..., 'family_input_complete', 'child_manse_view']
```

### 검증 13 — Part2 완료 후 PDF 조기 CTA 노출 + 클릭 시 사전 예약 페이지 진입

검증 2 흐름으로 Part2 완료까지 진행 (약 6분, LLM 비용 ~$0.10).

Part2 완료 후 snapshot:

```
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: "📄 20영역 PDF로 받아보고 싶으세요?" 버튼 노출 (deep-dive 영역 선택 버튼 아래).

클릭:

```
mcp__playwright__browser_click(target=<PDF 사전 예약 버튼 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: `/(flow)/pdf-preorder?source=part2_bonus` 진입. "📄 20개 영역 PDF 사전 예약" 헤더 + 19,900원 가격 + 이름·연락처 입력 필드. `__captured` 에 `paywall_preorder_click` (trigger=part2_bonus) + `pdf_preorder_view` 포함.

### 검증 14 — 사전 예약 제출 → DB row + payment_info_submit fire

```
mcp__playwright__browser_type(target=<이름 input ref>, text="테스트유저")
mcp__playwright__browser_type(target=<연락처 input ref>, text="test-e2e@example.com")
mcp__playwright__browser_click(target=<사전 예약하기 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: "사전 예약 완료" 화면.

```js
// Mixpanel spy 캡쳐 확인
() => window.__captured.filter(e => e.event === 'payment_info_submit')
// 기대: [{ event: 'payment_info_submit', props: { source: 'part2_bonus', contact_type: 'email', marketing_consent: true } }]
```

DB row 검증:

```sql
SELECT id, source, contact_type, marketing_consent, created_at
FROM public.pdf_preorders
WHERE name = '테스트유저' AND created_at > now() - interval '5 minutes'
ORDER BY created_at DESC LIMIT 1;
```

**기대**: row 1개, `source=part2_bonus`, `contact_type=email`, `marketing_consent=true`.

### 검증 15 — 회원 영역 cap 도달 → PaywallModal 사전 예약 CTA + section_cap_reached fire

회원 상태에서 영역 5개 본 상태를 localStorage 주입으로 위조 (LLM 비용 0):

```js
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  // 영역 5개 본 척
  s.deepDiveTexts = { '1': 'dummy', '2': 'dummy', '3': 'dummy', '4': 'dummy', '5': 'dummy' };
  localStorage.setItem(key, JSON.stringify(s));
  return { injected: 5 };
}
```

로그인 상태에서 deep-dive 페이지 진입:

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/interpret-deep-select")
mcp__playwright__browser_evaluate(function="<spy setup>")
mcp__playwright__browser_click(target=<6번째 새 영역 카드 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: PaywallModal 회원 content "🔎 5개 영역을 다 보셨네요" + "📄 정식 PDF 패키지 19,900원" + "사전 예약하기" 버튼.

```js
() => window.__captured.map(e => e.event)
// 기대: 'section_cap_reached', 'paywall_view'
```

클릭:

```
mcp__playwright__browser_click(target=<사전 예약하기 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: `/(flow)/pdf-preorder?source=section_cap` 진입. `__captured` 에 `paywall_preorder_click` (trigger=deepdive) + `pdf_preorder_view`.

```js
// 정리 — 가짜 deepDiveTexts 제거
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  s.deepDiveTexts = {};
  localStorage.setItem(key, JSON.stringify(s));
  return { restored: true };
}
```

### 검증 16 — 회원 자녀 cap 도달 → PaywallModal 사전 예약 CTA + child_cap_reached fire

회원 상태에서 자녀 5명 본 상태를 localStorage 주입:

```js
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  s.sessionsHistory = [1,2,3,4,5].map(i => ({
    sessionId: `fake-${i}-${Date.now()}`,
    childNickname: `자녀${i}`,
    childBirth: { year: 2015, month: 1, day: i, hour: 12 },
    savedAt: new Date().toISOString(),
    snapshot: {},
    hagunLabel: '평운',
  }));
  localStorage.setItem(key, JSON.stringify(s));
  return { injected: 5 };
}
```

로그인 상태에서 랜딩 진입:

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world")
mcp__playwright__browser_evaluate(function="<spy setup>")
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: CTA "🔒 다른 자녀 진단 · 곧 추가 예정". `__captured` 에 `child_cap_reached` (member=true).

CTA 클릭:

```
mcp__playwright__browser_click(target=<자녀 진단 버튼 ref>)
mcp__playwright__browser_snapshot(depth=3)
```

**기대**: PaywallModal 회원 content "🌱 자녀 5명까지 보셨네요" + 사전 예약 버튼. 클릭 → `/pdf-preorder?source=child_cap`.

```js
// 정리
() => {
  const key = 'eduluck.flow.state';
  const s = JSON.parse(localStorage.getItem(key) || '{}');
  s.sessionsHistory = [];
  localStorage.setItem(key, JSON.stringify(s));
  return { restored: true };
}
```

### 검증 11-16 정리 (DB)

```sql
-- 테스트로 만든 사전 예약 행 정리
DELETE FROM public.pdf_preorders WHERE name = '테스트유저';
```

### 검증 17 — SDK 52 prod hydration 회귀 (랜딩·admin·legal)

expo SDK 51 → 52 업그레이드 (commit 9a8fe1f) 후 prod에서 React 18.3.1 · expo-router 4.x · NativeWind · React Native Web hydration 정상 작동 확인. shamefully-hoist=true 적용 후 transitive deps 누락 없는지.

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/")
mcp__playwright__browser_snapshot()
mcp__playwright__browser_console_messages(onlyErrors=true)
```

**기대**: snapshot에 헤더 (eduluck 로고 + 카카오 로그인) + 메인 콘텐츠 (history 카드 또는 랜딩 hero) + LegalFooter (이용약관·개인정보·환불 + 사업자 정보 4종 + 통신판매업 신고번호 자리) + StickyCTA. console errors=0.

admin 라우트 격리 (Stack) 회귀:

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/admin")
mcp__playwright__browser_snapshot()
mcp__playwright__browser_console_messages(onlyErrors=true)
```

**기대**: "eduluck admin · 진단 데이터 검수·관리 콘솔" + Google·카카오 로그인 버튼 2종 + admin_users 안내. console errors=0.

legal 페이지 (Next 라우트):

```
mcp__playwright__browser_navigate(url="https://luck.z21labs.world/legal/refund")
mcp__playwright__browser_evaluate(function="() => ({
  hasRefund: document.body.innerText.includes('환불'),
  hasBiz: document.body.innerText.includes('881-84-00049'),
})")
```

**기대**: 둘 다 true. 잘 깨질 만한 시그널 — 'You need to install @expo/metro-runtime' / 'expo-asset cannot be found' / chunk 404 → ERROR로 잡힘.

### 검증 18 — Phase 1: POST /api/session JWT 옵셔널 + user_id 자동 매핑

비회원 (JWT 없음):

```bash
curl -sS -X POST https://luck.z21labs.world/api/session \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"e2e-anon-test"}'
```

**기대**: `{"sessionId":"<uuid>","expiresAt":"<iso>"}` 200.

DB 확인:

```sql
SELECT id, user_id, device_id FROM public.sessions
WHERE device_id = 'e2e-anon-test'
ORDER BY created_at DESC LIMIT 1;
```

**기대**: `user_id = NULL`, `device_id = 'e2e-anon-test'`.

회원 (admin이 직접 카카오 로그인 후 진단 시 자동 — curl로 회원 path 단순 모방은 불가, JWT 발급 자체가 OAuth 흐름 필요). 사람이 확인할 항목:

1. 카카오 로그인 → 새 진단 시작 → family-input 완주
2. 위 sessions row의 `user_id`가 `auth.users.id`로 박혀있는지:

```sql
SELECT s.id, s.user_id, s.device_id, u.email
FROM public.sessions s
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id IS NOT NULL
ORDER BY s.created_at DESC LIMIT 5;
```

### 검증 19 — Phase 1: GET /api/sessions/my 회원 history 서버 fetch

미인증 (Authorization 헤더 없음):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://luck.z21labs.world/api/sessions/my
```

**기대**: `401`.

잘못된 JWT:

```bash
curl -sS https://luck.z21labs.world/api/sessions/my \
  -H 'Authorization: Bearer invalid_jwt'
```

**기대**: `{"error":"invalid token"}` 401.

유효한 JWT (사람 검증 필요 — 회원 카카오 로그인 후 브라우저 DevTools에서 토큰 추출):

```js
// DevTools 콘솔 (회원 로그인 상태)
const { data } = await window.supabase.auth.getSession();
copy(data.session.access_token);
```

```bash
curl -sS https://luck.z21labs.world/api/sessions/my \
  -H "Authorization: Bearer <복사한_토큰>"
```

**기대**: `{"sessions": [{ sessionId, childNickname, childBirth, hagunLabel, primaryTier, savedAt }, ...]}` — 회원 본인 sessions 최대 20개.

`sessions[].hagunLabel`이 calculateFinalTierV2 결과 (예: "보강 학업형", "평운")로 박혀있는지 확인. 빈 배열이면 회원이 아직 진단 안 한 상태 (검증 18 회원 path 먼저 통과 필요).

## Cleanup (필수)

```sql
-- 테스트 진단 데이터 일괄 정리 — CASCADE 로 subjects·interpretations·feedback_responses 자동 삭제
DELETE FROM public.sessions WHERE id = '<sessionId>'::uuid;
```

```
mcp__playwright__browser_close()
```

## 결과 보고 템플릿

```
## E2E 검증 결과 — <commit sha>

| 검증 | Fix | 결과 |
|---|---|---|
| 1. feedback UNIQUE | DD3.B | ✅ 1차 200 / 2차 23505 / 다른 source 200 |
| 2. LLM 진단 onComplete 단일 발사 | BUG A·E·F | ✅ 같은 sessionId·kind = 각 1 row |
| 3. interpretations.prompt_version | DD1.A | ✅ v5.X-... 정확 |
| 4. history 카드 복원 | BUG 3·5 + 캐시 | ✅ LLM API 호출 0건, llm_call_count 변경 ✗ |
| 5. feedback 재제출 409 | DD3.B | ✅ 친화 에러 메시지 |
| 17. SDK 52 hydration | 9a8fe1f | ✅ /·/admin·/legal/refund 200 + console 0 error |
| 18. /api/session JWT 옵셔널 | 4db2d0e Phase 1 | ✅ 비회원 user_id NULL / 회원 path 사람 검증 필요 |
| 19. /api/sessions/my | 4db2d0e Phase 1 | ✅ 미인증·invalid JWT 401 / 유효 토큰 사람 검증 필요 |

추가 확인:
- VersionFooter <new sha> 노출
- sessions.device_id = client deviceId 정확 매칭
- sessions.llm_call_count = 2 (cap 50 안전)
- 본문 길이: Part1 ~10K + Part2 ~9K
```

## 알려진 한계

- Playwright `browser_wait_for` 의 timeout 30초 hardcoded — `browser_evaluate` 의 `setTimeout` polling 으로 우회 (위 patterns 참조)
- Anthropic Sonnet 4.6 / Haiku 4.5 stream 응답 약 3-4분 (Part 1) + Part 2 prefetch 5초 delay
- Mixpanel funnel 정확도는 별도 검증 (Mixpanel MCP OAuth 후)
- 결제 (Stripe·Toss 등) 활성화 시 별도 webhook 검증 패턴 추가

## 다음 변경

- 결제 활성화 시 `/api/checkout` 신규 + signed webhook 검증 추가
- prompt XML wrapping 도입 시 system prompt 노출 회피 검증 추가
- mom test 시작 후 funnel drop-off 자동 분석 (Mixpanel MCP)
