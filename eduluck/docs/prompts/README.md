# docs/prompts — LLM system prompt 가독성 사본

prompt 단일 소스는 `eduluck/lib/prompts/*.ts` (백틱 리터럴 const). 이 디렉토리의 `.md` 파일은 같은 텍스트를 markdown으로 dump한 **사람이 IDE에서 읽기 좋은 사본**이다. 코드는 참조하지 않는다.

## 파일

### v5 (현재 운영 — Part 1 / Part 2 / Deep-dive 분리)

| 파일 | 소스 | 엔드포인트 |
|---|---|---|
| `interpret-premium-part1.md` | `lib/prompts/interpret-premium-part1.ts` | `POST /api/interpret-premium-part1` |
| `interpret-premium-part2.md` | `lib/prompts/interpret-premium-part2.ts` | `POST /api/interpret-premium-part2` |
| `interpret-deep.md` | `lib/prompts/interpret-deep.ts` | `POST /api/interpret-deep` (section 1~20) |

### 그 외

| 파일 | 소스 | 비고 |
|---|---|---|
| `interpret-free.md` | `lib/prompts/interpret-free.ts` | 무료 간이 진단 |
| `relation-mini.md` | `lib/prompts/relation-mini.ts` | 부모-자녀 관계 미니 분석 |
| `interpret-premium-legacy-v4.md` | `lib/prompts/interpret-premium.ts` | v4 16섹션 단일 호출 (v5 도입 후 미사용, 사용처 0 확인되면 별도 cleanup commit으로 삭제 예정) |

## v5 사본 갱신

`lib/prompts/interpret-premium-{part1,part2,deep}.ts` 수정 후:

```sh
cd eduluck
npx tsx scripts/dump-prompts-v5.ts --write
```

`docs/prompts/interpret-premium-part1.md`·`part2.md`·`deep.md` 3개가 lib에서 자동 dump된다. legacy 3개(interpret-free·relation-mini·interpret-premium-legacy-v4)는 자동 갱신 대상 아님 — 필요 시 같은 패턴으로 dump 추가.

## 단일 소스 원칙

prompt 수정은 `lib/prompts/*.ts`에서만. `docs/prompts/*.md`는 직접 편집해도 코드 동작에 영향 없고 dump 시 덮어써진다.
