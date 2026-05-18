// DST 보정 모듈 단위 테스트
//
// 테스트 케이스:
//   - DST 기간 안 → -1시간 보정
//   - DST 기간 밖 → 변경 없음
//   - 자정 통과 (00:30 입력 → 전일 23:30)
//   - DST 시작/종료 경계 (1987-05-10 02:00 정확 시점)

// sajutalk는 CJS, prompt_checker는 ESM이라 createRequire로 브리지.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { applyDstCorrection } = require('../../sajutalk/lib/manse/dst.ts') as typeof import('../../sajutalk/lib/manse/dst.ts');

interface Case {
  name: string;
  input: { y: number; m: number; d: number; h: number; min: number };
  expect: { applied: boolean; y?: number; m?: number; d?: number; h: number; min: number };
}

const cases: Case[] = [
  // 1987-88 (학운 핵심)
  { name: '1987-08-15 12:30 (DST 중)', input: { y: 1987, m: 8, d: 15, h: 12, min: 30 },
    expect: { applied: true, y: 1987, m: 8, d: 15, h: 11, min: 30 } },
  { name: '1988-08-15 12:30 (DST 중)', input: { y: 1988, m: 8, d: 15, h: 12, min: 30 },
    expect: { applied: true, y: 1988, m: 8, d: 15, h: 11, min: 30 } },
  { name: '1988-07-01 12:30 (DST 중)', input: { y: 1988, m: 7, d: 1, h: 12, min: 30 },
    expect: { applied: true, h: 11, min: 30 } },
  { name: '1988-11-15 12:30 (DST 종료 후)', input: { y: 1988, m: 11, d: 15, h: 12, min: 30 },
    expect: { applied: false, h: 12, min: 30 } },
  { name: '1989-08-15 12:30 (DST 폐지 후)', input: { y: 1989, m: 8, d: 15, h: 12, min: 30 },
    expect: { applied: false, h: 12, min: 30 } },

  // DST 시작 경계 (1987-05-10 02:00)
  { name: '1987-05-10 01:30 (DST 시작 직전)', input: { y: 1987, m: 5, d: 10, h: 1, min: 30 },
    expect: { applied: false, h: 1, min: 30 } },
  { name: '1987-05-10 02:00 (DST 시작 정확)', input: { y: 1987, m: 5, d: 10, h: 2, min: 0 },
    expect: { applied: true, h: 1, min: 0 } },
  { name: '1987-05-10 03:00 (DST 시작 후)', input: { y: 1987, m: 5, d: 10, h: 3, min: 0 },
    expect: { applied: true, h: 2, min: 0 } },

  // DST 종료 경계 (1988-10-09 03:00)
  { name: '1988-10-09 02:30 (DST 종료 직전)', input: { y: 1988, m: 10, d: 9, h: 2, min: 30 },
    expect: { applied: true, h: 1, min: 30 } },
  { name: '1988-10-09 03:00 (DST 종료 정확)', input: { y: 1988, m: 10, d: 9, h: 3, min: 0 },
    expect: { applied: false, h: 3, min: 0 } },

  // 자정 통과 — DST 중 00:30 입력 → 전일 23:30
  { name: '1988-08-15 00:30 (자정 통과)', input: { y: 1988, m: 8, d: 15, h: 0, min: 30 },
    expect: { applied: true, y: 1988, m: 8, d: 14, h: 23, min: 30 } },

  // 1955-60 시기
  { name: '1956-07-15 12:00 (1956 DST 중)', input: { y: 1956, m: 7, d: 15, h: 12, min: 0 },
    expect: { applied: true, h: 11, min: 0 } },
  { name: '1956-04-15 12:00 (1956 DST 전)', input: { y: 1956, m: 4, d: 15, h: 12, min: 0 },
    expect: { applied: false, h: 12, min: 0 } },

  // 1948
  { name: '1948-07-15 12:00 (1948 DST 중)', input: { y: 1948, m: 7, d: 15, h: 12, min: 0 },
    expect: { applied: true, h: 11, min: 0 } },

  // 일반 케이스 (DST 적용 없음)
  { name: '2024-08-15 12:30', input: { y: 2024, m: 8, d: 15, h: 12, min: 30 },
    expect: { applied: false, h: 12, min: 30 } },
  { name: '1976-01-03 23:00', input: { y: 1976, m: 1, d: 3, h: 23, min: 0 },
    expect: { applied: false, h: 23, min: 0 } },
];

let passed = 0, failed = 0;
const failures: string[] = [];

for (const c of cases) {
  const r = applyDstCorrection(c.input.y, c.input.m, c.input.d, c.input.h, c.input.min);
  const okApplied = r.applied === c.expect.applied;
  const okHour = r.hour === c.expect.h;
  const okMin = r.minute === c.expect.min;
  const okY = c.expect.y === undefined || r.year === c.expect.y;
  const okM = c.expect.m === undefined || r.month === c.expect.m;
  const okD = c.expect.d === undefined || r.day === c.expect.d;
  const allOk = okApplied && okHour && okMin && okY && okM && okD;

  if (allOk) {
    passed++;
    console.log(`✓ ${c.name}`);
  } else {
    failed++;
    const detail = `applied=${r.applied}(기대 ${c.expect.applied}), ${r.year}-${r.month}-${r.day} ${r.hour}:${r.minute} (기대 ${c.expect.y ?? '?'}-${c.expect.m ?? '?'}-${c.expect.d ?? '?'} ${c.expect.h}:${c.expect.min})${r.label ? ` [${r.label}]` : ''}`;
    console.log(`✗ ${c.name}`);
    console.log(`   ${detail}`);
    failures.push(`${c.name}: ${detail}`);
  }
}

console.log(`\n총 ${cases.length}건, 통과 ${passed}, 실패 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
