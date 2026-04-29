# prompt_checker

사주톡 AI 프롬프트 반복 테스트 도구.

`sajutalk/prompts/*.md` 를 단일 소스로 두고, 여러 사주(fixture)에 대해 일괄 실행 → 좌우 diff 뷰어로 결과 비교.

## 폴더

```
prompt_checker/
├─ fixtures/       1~N개 사주 케이스 (.json)
├─ outputs/
│  ├─ current/     매 실행 결과 (gitignore)
│  └─ keepers/     마음에 들었던 결과 (commit)
├─ scripts/
│  ├─ test.ts      매트릭스 러너
│  ├─ promote.ts   current → keeper 복사
│  └─ view.ts      diff 웹뷰어
└─ package.json
```

## 사용법

### 0. 셋업 (최초 1회)

```bash
cd prompt_checker
npm install
```

### 1. dev 서버 띄우기 (다른 터미널에서)

```bash
cd sajutalk
npm run dev -- --port 3002
```

### 2. 프롬프트 수정

`sajutalk/prompts/interpret-daily.md` 를 편집.

### 3. 실행

```bash
# 전체 (prompts × fixtures 곱셈)
npm run test

# 특정 프롬프트만
npm run test -- --prompt interpret-daily

# 특정 fixture만
npm run test -- --fixture leehonggyu

# 1개만
npm run test -- --prompt interpret-daily --fixture leehonggyu
```

### 4. 결과 비교

```bash
npm run view
```
브라우저가 자동으로 열림. 사이드바에서 case 선택, 토글로 좌우/한줄 모드 전환.

### 5. 마음에 든 결과를 기준으로 박기 (keeper)

```bash
npm run promote -- --prompt interpret-daily --fixture leehonggyu
```

이후 `npm run test` 실행 시 keeper와의 diff가 표시됨.

## fixture 추가

`fixtures/` 에 `.json` 파일 추가하면 자동으로 매트릭스에 포함됨.

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

## 비용 안내

Sonnet 4.6 기준 1개 케이스 ≈ $0.05. 5개 fixture × 10회 반복 = $2.5. 한 달 집중 작업 시 $30~50 수준.

`--prompt`, `--fixture` 플래그로 1개씩만 돌리면 비용 절감.
