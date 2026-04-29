# prompt_checker

사주톡 AI 프롬프트 반복 테스트 도구.

`sajutalk/prompts/*.md` 를 단일 소스로 두고, 웹 어드민에서 편집 → 실행 → diff 비교를 한 화면에서 처리.

## 폴더

```
prompt_checker/
├─ fixtures/       1~N개 사주 케이스 (.json)
├─ outputs/
│  ├─ current/     매 실행 결과 (gitignore)
│  └─ keepers/     마음에 들었던 결과 (commit)
├─ scripts/
│  ├─ test.ts      매트릭스 러너 (CLI)
│  ├─ promote.ts   current → keeper 복사 (CLI)
│  └─ view.ts      🌟 웹 어드민 (편집 + 실행 + diff + promote)
└─ package.json
```

## 빠른 시작

### 0. 셋업 (최초 1회)

```bash
cd prompt_checker
npm install
```

### 1. 어드민 실행 (한 줄)

```bash
cd prompt_checker
npm run view
```

자동으로:
- sajutalk dev 서버 기동 (이미 띄워져 있으면 재사용)
- 어드민 서버 시작 (localhost:4321)
- 브라우저 자동 오픈

`Ctrl+C`로 종료하면 sajutalk dev 서버도 함께 종료됨.

> sajutalk dev 서버를 별도 터미널에서 직접 관리하고 싶으면 (예: 로그 분리 등) 먼저 `cd sajutalk && npm run dev -- --port 3002` 띄운 후 `npm run view` 실행. 어드민이 자동 감지해서 새로 띄우지 않음.

## 웹 어드민 사용법

```
┌────────────────────────────────────────────────────┐
│ [interpret-daily ▼] × [전체 fixture ▼]  [💾] [▶]  │
├────────────────────────────────────────────────────┤
│ 프롬프트 편집                                       │
│ ┌────────────────────────────────────────────┐     │
│ │ 당신은 사주 데이터를 바탕으로...           │     │
│ │ (textarea, 직접 편집)                      │     │
│ └────────────────────────────────────────────┘     │
├────────────────────────────────────────────────────┤
│ 실행 진행 (스트리밍)                                │
│ ▸ interpret-daily__leehonggyu                     │
│   스트리밍: ........................ 완료          │
├────────────────────────────────────────────────────┤
│ 결과 비교                                           │
│ [🟢 leehonggyu] [⚪ younger-female] ...             │
│ [🟢 키퍼로]  [좌우 비교] [한 줄 diff]              │
│ ┌──── keeper ────┬──── current ────┐               │
│ │ 변경된 내용은 빨간/초록 표시      │               │
│ └────────────────┴─────────────────┘               │
└────────────────────────────────────────────────────┘
```

**일상 워크플로우**:
1. 프롬프트 드롭다운에서 `interpret-daily` 선택 → editor에 .md 내용 자동 로드
2. 직접 편집 (`<textarea>`)
3. fixture 선택: 특정 1개 또는 "전체 fixture"
4. **[▶ 저장 후 실행]** 클릭 → 자동 저장 + AI 호출 + 진행 상황 스트리밍
5. 끝나면 결과 탭에서 케이스 클릭 → 좌우 비교 화면
6. 마음에 들면 **[🟢 이 결과를 키퍼로]** 클릭 → 새 기준 갱신

터미널 안 봐도 됩니다.

상태 아이콘:
- 🟢 keeper + current 둘 다 있음 (diff 표시)
- ⚪ keeper 없음 (현재 결과만 표시 — 키퍼로 박아주세요)
- ⚠ current 없음 (실행 후 다시)

## fixture 추가

`fixtures/` 에 `.json` 파일 추가 → 어드민 새로고침하면 fixture 드롭다운에 자동 등장.

```json
{
  "name": "이름",
  "gender": "male",
  "birthYear": 1990,
  "birthMonth": 5,
  "birthDay": 15,
  "birthHour": 14,
  "birthMinute": 30,
  "concern": "이직",
  "pattern": "...",
  "tone": "daily"
}
```

## 프롬프트 추가

`sajutalk/prompts/` 에 `.md` 파일 추가 → `lib/prompts/interpret.ts` 에 `loadPromptFile('새이름.md')` 호출 함수 추가 → 어드민 새로고침하면 자동 등장.

## CLI 명령어 (어드민 안 쓰고 직접)

```bash
npm run test                                          # 전체 매트릭스
npm run test -- --prompt interpret-daily              # 특정 프롬프트
npm run test -- --fixture leehonggyu                  # 특정 fixture
npm run promote -- --prompt X --fixture Y             # 키퍼로
```

## 비용 안내

Sonnet 4.6 기준 1개 케이스 ≈ $0.05. 5개 fixture × 10회 반복 = $2.5. 한 달 집중 작업 시 $30~50 수준.

특정 프롬프트·fixture 1개씩만 돌리면 비용 절감. 어드민에서 fixture 드롭다운으로 1개 선택 가능.
