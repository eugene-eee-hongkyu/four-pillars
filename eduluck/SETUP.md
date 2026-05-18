# eduluck — 사람 셋업 가이드

> Claude Code 자율 작업 외에 **사람이 직접 해야 하는 것**만 모음.
> 한 번 끝내면 끝. Phase 0 + Phase 7(Vercel deploy 1회).

---

## Phase 0 — Supabase 신규 프로젝트 (필수, 10~15분)

### 1) 프로젝트 생성

1. [supabase.com/dashboard](https://supabase.com/dashboard) 로그인 (이메일 = `eugene.eee@iskra.world`)
2. 화면 우측 상단 **"New project"** 클릭
3. Organization: **`eugene-eee-hongkyu's Org`** 선택
4. 다음 필드 입력:
   | 필드 | 값 |
   |---|---|
   | Project name | `eduluck` |
   | Database Password | (강력한 패스워드 1Password 등에 저장) |
   | Region | **`Northeast Asia (Seoul)`** ← 매우 중요, 한국 학부모 latency |
5. **"Create new project"** → 1~2분 대기 (프로비저닝)

### 2) 키 3개 발급

프로비저닝 완료되면 좌측 사이드바 **⚙ Settings → API** 클릭. 다음 3개 값을 복사:

| 환경변수 | 위치 (Settings → API) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" 박스 (예: `https://abcxyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API keys" → **anon public** 행의 긴 `eyJ...` 문자열 |
| `SUPABASE_SERVICE_ROLE_KEY` | "Project API keys" → **service_role secret** 행의 긴 `eyJ...` 문자열 ⚠️ |

> ⚠️ **`service_role` 키는 RLS를 우회**한다. 절대 클라이언트 코드 (`app/`, `components/`)에 import 금지. 노출되면 모든 DB 데이터에 풀 접근 가능. Claude Code도 이 규칙을 `lib/supabase/server.ts`에서만 사용하도록 강제됨 (B-1 v2 §9 트리거 #10).

### 3) `eduluck/.env.local` 값 채우기

`eduluck/.env.local` 파일을 열고 다음 3줄의 placeholder를 위에서 복사한 실제 값으로 교체:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co       ← 교체
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...PLACEHOLDER                     ← 교체
SUPABASE_SERVICE_ROLE_KEY=eyJ...PLACEHOLDER                         ← 교체
```

(다른 값들은 이미 채워져 있음 — Anthropic key는 sajutalk 재사용, SESSION_COOKIE_SECRET는 자동 생성됨.)

### 4) Auth Email Provider 확인 (기본 ON)

좌측 사이드바 **Authentication → Providers → Email** 열어서:
- **Enable Email Provider** = ON (기본값)
- **Confirm email** = ON (기본값) — OTP 발송 시 필요
- **Secure email change** = ON (기본값)

### 5) (선택) 이메일 템플릿 한글화

좌측 **Authentication → Email Templates** → **Magic Link** 선택:

기본 영문 템플릿을 한글로 편집하면 사용자 경험 ↑. MVP 검증 단계에는 영문 그대로도 OK.

> 가독성 좋은 한글 예시:
> - Subject: `eduluck 인증 코드`
> - Body: `안녕하세요! 다음 6자리 코드를 입력해주세요: {{ .Token }} (10분 후 만료)`

### 6) Claude에게 "Supabase 셋업 완료" 알리기

위 1)~4) 모두 끝났으면 Claude 채팅에 **"Supabase 셋업 완료"** 한 마디 입력.

Claude가 즉시:
- `mcp__supabase__apply_migration` × 2 (init + RLS) → DB 스키마 + RLS 정책 자동 apply
- `mcp__supabase__list_tables` / `get_advisors` → 보안 점검 3종 자동 실행
- Phase 4·5·6 진행 → 화면 11개 + E2E 시나리오 3개

---

## Phase 7 — Vercel preview deploy (필수, 5분)

> Phase 5·6까지 자율 완료된 후 진행. Claude가 안내 시점 알림.

### 1) GitHub repo 권한 부여 (1회)

1. [vercel.com](https://vercel.com) 로그인 (GitHub OAuth)
2. **Add New → Project** → `eugene-eee-hongkyu/four-pillars` repo 선택
3. **Root Directory** 설정 = **`eduluck`** ⚠️ (monorepo 형태이므로 필수)
4. Framework Preset: **Other** (Expo Router는 자동 감지 안 됨)
5. Build Command: `pnpm build:web` (`expo export --platform web`)
6. Output Directory: `dist`
7. Install Command: `pnpm install`
8. Environment Variables: `.env.local` 5종 그대로 복사 + Production·Preview 모두 set
9. **Deploy** 클릭

### 2) Preview URL 확보

Vercel이 빌드 완료하면 `eduluck-xxx.vercel.app` URL 발급. Claude 채팅에 URL 공유.

Claude가:
- Playwright E2E 시나리오 1·2·3을 preview URL에 재실행
- 포터빌리티 13개 + RLS 3종 보안 점검
- §12 완료 보고 작성

### 3) Production push는 v1.5 (지금 X)

`vercel --prod` 또는 main branch 자동 production deploy는 다음 모두 준비된 후:
- 도메인 (예: `eduluck.app`)
- Custom SMTP (Supabase 기본 메일 spam 분류 위험)
- 실 결제 게이트웨이 (Toss·KakaoPay)

B-1 v2 §9 멈춤 트리거 #12로 forcing.

---

## 비용 요약

| 서비스 | MVP 단계 | v1.5 단계 |
|---|---|---|
| Anthropic API | sajutalk 키 재사용 (~$15 예상) | 별도 키 또는 organization 추적 |
| Supabase | Free tier (500MB DB · 50K MAU · hourly 30 mail) | Pro $25/월 |
| Vercel | Hobby Free | Pro $20/월 (정밀 진단 60s timeout 한계 해소) |
| 도메인 | 없음 (vercel.app) | 연 ~15,000원 |

**MVP 100명 검증 총 비용: ~$15 (Anthropic API only)**

---

## 트러블슈팅

### Supabase 프로젝트 생성 시 "Free quota exhausted"
현재 free tier는 organization당 2개 프로젝트. 3개째부터는 $10/월. 4번째인 eduluck도 $10/월 발생 가능.

대안:
- 사용하지 않는 기존 프로젝트(예: `ai-usage-tracker`) pause 후 신규 생성
- 또는 sajutalk 프로젝트 공유 (테이블 prefix `eduluck_*` 또는 별도 schema)

### `.env.local` 값 교체 후 dev server 재시작 안 됨
`eduluck/` 디렉토리에서:
```
cd eduluck
pkill -f "expo start"
pnpm dev
```

### OTP 메일이 spam 폴더에 가는 경우
MVP 단계는 기본 발송자 (`noreply@mail.app.supabase.io`) 사용. 학부모 메일 (네이버·다음 등)에서 spam 분류 가능. v1.5에서 custom SMTP (Resend·SendGrid) 또는 자체 도메인 SPF/DKIM 설정.

dev 환경에서는 Phase 6에서 OTP 콘솔 출력 분기를 추가해 자동 추출 — 사람 의존 X.
