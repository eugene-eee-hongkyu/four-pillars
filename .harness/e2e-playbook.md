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
