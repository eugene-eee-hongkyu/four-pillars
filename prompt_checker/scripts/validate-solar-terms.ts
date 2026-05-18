// 년주·월주 자체 계산 검증
// 기존 라이브러리가 부정확했던 케이스 + 기존 라이브러리가 정확했던 케이스 모두 확인.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { calcYearPillar, calcMonthPillar, findPrevJie } = require('../../sajutalk/lib/manse/solar-terms.ts') as typeof import('../../sajutalk/lib/manse/solar-terms.ts');

interface Case {
  name: string;
  year: number; month: number; day: number; hour: number; minute: number;
  expectYear: string;     // 명리학적 년주
  expectMonth: string;    // 명리학적 월주
  note?: string;
}

const cases: Case[] = [
  // ── 라이브러리가 부정확했던 케이스 (입춘 당일 절기 전 출생) ──
  { name: '2024-02-04 17:00 (입춘 17:27 27분 전)', year: 2024, month: 2, day: 4, hour: 17, minute: 0,
    expectYear: '계묘', expectMonth: '을축', note: 'KASI 입춘 17:27 — 전이라 2023년 명리' },
  { name: '2024-02-04 18:00 (입춘 33분 후)', year: 2024, month: 2, day: 4, hour: 18, minute: 0,
    expectYear: '갑진', expectMonth: '병인' },
  { name: '2020-02-04 17:00 (입춘 18:03 전)', year: 2020, month: 2, day: 4, hour: 17, minute: 0,
    expectYear: '기해', expectMonth: '정축', note: '2019년 명리' },
  { name: '2022-02-04 04:00 (입춘 05:50 전)', year: 2022, month: 2, day: 4, hour: 4, minute: 0,
    expectYear: '신축', expectMonth: '신축', note: '2021년 명리' },
  { name: '2023-02-04 10:00 (입춘 11:42 전)', year: 2023, month: 2, day: 4, hour: 10, minute: 0,
    expectYear: '임인', expectMonth: '계축', note: '2022년 명리' },

  // ── 라이브러리가 정확했던 케이스 (검증 회귀) ──
  { name: '2025-02-03 22:00 (입춘 23:10 전)', year: 2025, month: 2, day: 3, hour: 22, minute: 0,
    expectYear: '갑진', expectMonth: '정축', note: '2024년 명리' },
  { name: '2021-02-03 22:00 (입춘 23:58 전)', year: 2021, month: 2, day: 3, hour: 22, minute: 0,
    expectYear: '경자', expectMonth: '기축', note: '2020년 명리' },

  // ── 일반 케이스 ──
  { name: '1976-01-03 23:00 (이홍규 케이스)', year: 1976, month: 1, day: 3, hour: 23, minute: 0,
    expectYear: '을묘', expectMonth: '무자', note: '소한 전, 1976 명리. 1975 입춘부터 1976 입춘 전까지 = 1975 명리? 1976-01-03은 1976 입춘(02-05) 전이라 1975 명리: 을묘년. 12월절(자月) 진행 중.' },
  { name: '1990-06-15 14:30', year: 1990, month: 6, day: 15, hour: 14, minute: 30,
    expectYear: '경오', expectMonth: '임오', note: '망종(6/6) ~ 소서(7/7) = 午月. 庚년 午= 壬' },
  { name: '2000-12-15 10:00', year: 2000, month: 12, day: 15, hour: 10, minute: 0,
    expectYear: '경진', expectMonth: '무자', note: '대설(12/7) ~ 소한 전 = 子月. 庚년 子= 戊' },

  // ── 절기 경계 ±1분 ──
  { name: '2024-02-04 17:26 (입춘 1분 전)', year: 2024, month: 2, day: 4, hour: 17, minute: 26,
    expectYear: '계묘', expectMonth: '을축' },
  { name: '2024-02-04 17:28 (입춘 1분 후)', year: 2024, month: 2, day: 4, hour: 17, minute: 28,
    expectYear: '갑진', expectMonth: '병인' },
];

let passed = 0, failed = 0;
for (const c of cases) {
  try {
    const yp = calcYearPillar(c.year, c.month, c.day, c.hour, c.minute);
    const mp = calcMonthPillar(c.year, c.month, c.day, c.hour, c.minute);
    const okYear = yp.pillar === c.expectYear;
    const okMonth = mp.pillar === c.expectMonth;
    if (okYear && okMonth) {
      passed++;
      console.log(`✓ ${c.name} → ${yp.pillar} ${mp.pillar} (${mp.jie}월)`);
    } else {
      failed++;
      console.log(`✗ ${c.name}`);
      console.log(`   결과: ${yp.pillar} ${mp.pillar} (${mp.jie}월)`);
      console.log(`   기대: ${c.expectYear} ${c.expectMonth}`);
      if (c.note) console.log(`   비고: ${c.note}`);
    }
  } catch (e) {
    failed++;
    console.log(`✗ ${c.name} - 예외: ${(e as Error).message}`);
  }
}

console.log(`\n총 ${cases.length}건, 통과 ${passed}, 실패 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
