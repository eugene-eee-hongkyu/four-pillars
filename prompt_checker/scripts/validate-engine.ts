// 보정된 engine.ts 통합 검증
// DST + 절기 보정이 함께 작동하는지, 기존 케이스에 회귀 없는지 확인

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { computeManse } = require('../../sajutalk/lib/manse/engine.ts') as typeof import('../../sajutalk/lib/manse/engine.ts');

interface Case {
  name: string;
  input: { year: number; month: number; day: number; hour?: number; minute?: number; gender: 'male' | 'female' };
  expect: { year: string; month: string; day: string; hour?: string };
  note?: string;
}

const cases: Case[] = [
  // ── 라이브러리가 부정확했던 절기 당일 케이스 (보정 후 정확해야) ──
  { name: '2024-02-04 17:00 (입춘 27분 전)',
    input: { year: 2024, month: 2, day: 4, hour: 17, minute: 0, gender: 'male' },
    expect: { year: '계묘', month: '을축', day: '무술' },
    note: '명리학적 2023년, 1월절(축月)' },
  { name: '2024-02-04 18:00 (입춘 33분 후)',
    input: { year: 2024, month: 2, day: 4, hour: 18, minute: 0, gender: 'male' },
    expect: { year: '갑진', month: '병인', day: '무술' },
    note: '명리학적 2024년, 2월절(인月)' },
  { name: '2022-02-04 04:00 (입춘 05:50 전)',
    input: { year: 2022, month: 2, day: 4, hour: 4, minute: 0, gender: 'female' },
    expect: { year: '신축', month: '신축' },
    note: '명리학적 2021년. 일주는 라이브러리 신뢰' },

  // ── DST 보정 케이스 (1988 출생, 학운 부모 핵심) ──
  { name: '1988-08-15 12:30 (서머타임 중)',
    input: { year: 1988, month: 8, day: 15, hour: 12, minute: 30, gender: 'male' },
    expect: { year: '무진', month: '경신', day: '임인' },
    note: 'DST -1h 적용 후 11:30으로 계산되어야' },

  // ── 기존 사주톡 검증 케이스 (회귀 방지) ──
  { name: '1976-01-03 23:00 (이홍규)',
    input: { year: 1976, month: 1, day: 3, hour: 23, minute: 0, gender: 'male' },
    expect: { year: '을묘', month: '무자', day: '갑인', hour: '을해' },
    note: '소한 전 = 12월절(자月), 명리학적 1975년 = 을묘' },
  { name: '1990-06-15 14:30',
    input: { year: 1990, month: 6, day: 15, hour: 14, minute: 30, gender: 'female' },
    expect: { year: '경오', month: '임오' },
    note: '망종 후 = 5월절(오月)' },

  // ── DST + 절기 동시 (rare) ──
  { name: '1988-02-04 17:00 (입춘 전, DST 아님)',
    input: { year: 1988, month: 2, day: 4, hour: 17, minute: 0, gender: 'male' },
    expect: { year: '정묘' },
    note: '입춘 전 → 1987년 명리. 1988-02-04는 DST(5/8~10/9) 밖' },

  // ── 사주톡 빌드 단계에서 포스텔러 10/10 통과한 검증 케이스 (회귀 방지) ──
  // 모두 시진·절기 경계 회피한 안전한 케이스라 보정 적용 후에도 결과 동일해야
  { name: '회귀 1990-05-15 14:00 男', input: { year: 1990, month: 5, day: 15, hour: 14, minute: 0, gender: 'male' },
    expect: { year: '경오', month: '신사' } },
  { name: '회귀 1985-02-03 22:00 女', input: { year: 1985, month: 2, day: 3, hour: 22, minute: 0, gender: 'female' },
    expect: { year: '갑자', month: '정축' }, note: '2월 3일은 입춘 04일 전, 명리학적 1984년 = 갑자' },
  { name: '회귀 1995-08-20 06:00 男', input: { year: 1995, month: 8, day: 20, hour: 6, minute: 0, gender: 'male' },
    expect: { year: '을해', month: '갑신' } },
  { name: '회귀 1978-11-07 00:00 女', input: { year: 1978, month: 11, day: 7, hour: 0, minute: 0, gender: 'female' },
    expect: { year: '무오', month: '임술' }, note: '입동 11/8 03:34 전 → 戌月' },
  { name: '회귀 2000-01-01 12:00 男', input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: 'male' },
    expect: { year: '기묘', month: '병자' }, note: '1월 1일은 입춘 전, 명리학적 1999년 = 기묘' },
];

let passed = 0, failed = 0;
for (const c of cases) {
  try {
    const r = computeManse(c.input);
    const okYear = r.yearPillar === c.expect.year;
    const okMonth = c.expect.month ? r.monthPillar === c.expect.month : true;
    const okDay = c.expect.day ? r.dayPillar === c.expect.day : true;
    const okHour = c.expect.hour ? r.hourPillar === c.expect.hour : true;

    if (okYear && okMonth && okDay && okHour) {
      passed++;
      console.log(`✓ ${c.name}`);
      console.log(`   ${r.yearPillar} ${r.monthPillar} ${r.dayPillar}${r.hourPillar ? ' ' + r.hourPillar : ''}`);
    } else {
      failed++;
      console.log(`✗ ${c.name}`);
      console.log(`   결과: ${r.yearPillar} ${r.monthPillar} ${r.dayPillar}${r.hourPillar ? ' ' + r.hourPillar : ''}`);
      console.log(`   기대: ${c.expect.year} ${c.expect.month ?? '?'} ${c.expect.day ?? '?'}${c.expect.hour ? ' ' + c.expect.hour : ''}`);
      if (c.note) console.log(`   비고: ${c.note}`);
    }
  } catch (e) {
    failed++;
    console.log(`✗ ${c.name} — 예외: ${(e as Error).message}`);
  }
}

console.log(`\n총 ${cases.length}건, 통과 ${passed}, 실패 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
