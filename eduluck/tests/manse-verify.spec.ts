// 만세력 검증 — prompt_checker/scripts/validate-engine.ts 12건 + sajutalk 검증 케이스 회귀 방지
// 이 케이스들은 sajutalk에서 포스텔러 10/10 통과 + KASI 절기 보정 + DST 보정 검증 완료된 정답.
// Claude Code는 expected 값을 임의로 수정할 수 없다. FAIL 시 B-1 v2 §9 트리거 #6 발동.

import { describe, test, expect } from 'vitest';
import { computeManse } from '@/lib/manse/engine';

interface Case {
  name: string;
  input: { year: number; month: number; day: number; hour?: number; minute?: number; gender: 'male' | 'female' };
  expect: { year: string; month?: string; day?: string; hour?: string };
  note?: string;
}

const CASES: Case[] = [
  // ── 라이브러리가 부정확했던 절기 당일 케이스 (자체 보정 후 정확) ──
  {
    name: '2024-02-04 17:00 (입춘 27분 전)',
    input: { year: 2024, month: 2, day: 4, hour: 17, minute: 0, gender: 'male' },
    expect: { year: '계묘', month: '을축', day: '무술' },
    note: '명리학적 2023년, 1월절(축月)',
  },
  {
    name: '2024-02-04 18:00 (입춘 33분 후)',
    input: { year: 2024, month: 2, day: 4, hour: 18, minute: 0, gender: 'male' },
    expect: { year: '갑진', month: '병인', day: '무술' },
    note: '명리학적 2024년, 2월절(인月)',
  },
  {
    name: '2022-02-04 04:00 (입춘 05:50 전)',
    input: { year: 2022, month: 2, day: 4, hour: 4, minute: 0, gender: 'female' },
    expect: { year: '신축', month: '신축' },
    note: '명리학적 2021년',
  },

  // ── DST 보정 케이스 (1988 출생, eduluck 학부모 핵심) ──
  {
    name: '1988-08-15 12:30 (서머타임 중)',
    input: { year: 1988, month: 8, day: 15, hour: 12, minute: 30, gender: 'male' },
    expect: { year: '무진', month: '경신', day: '임인' },
    note: 'DST -1h 적용 후 11:30 계산',
  },
  {
    name: '1988-02-04 17:00 (입춘 전, DST 아님)',
    input: { year: 1988, month: 2, day: 4, hour: 17, minute: 0, gender: 'male' },
    expect: { year: '정묘' },
    note: '입춘 전 → 1987년 명리. DST(5/8~10/9) 밖',
  },

  // ── 사주톡 회귀 방지 케이스 (포스텔러 10/10 통과) ──
  {
    name: '회귀 1976-01-03 23:00 男',
    input: { year: 1976, month: 1, day: 3, hour: 23, minute: 0, gender: 'male' },
    expect: { year: '을묘', month: '무자', day: '갑인', hour: '을해' },
    note: '소한 전 = 12월절(자月), 명리학적 1975년',
  },
  {
    name: '회귀 1990-06-15 14:30',
    input: { year: 1990, month: 6, day: 15, hour: 14, minute: 30, gender: 'female' },
    expect: { year: '경오', month: '임오' },
    note: '망종 후 = 5월절(오月)',
  },
  {
    name: '회귀 1990-05-15 14:00 男',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 0, gender: 'male' },
    expect: { year: '경오', month: '신사' },
  },
  {
    name: '회귀 1985-02-03 22:00 女',
    input: { year: 1985, month: 2, day: 3, hour: 22, minute: 0, gender: 'female' },
    expect: { year: '갑자', month: '정축' },
    note: '2/3 = 입춘 04일 전, 명리학적 1984년',
  },
  {
    name: '회귀 1995-08-20 06:00 男',
    input: { year: 1995, month: 8, day: 20, hour: 6, minute: 0, gender: 'male' },
    expect: { year: '을해', month: '갑신' },
  },
  {
    name: '회귀 1978-11-07 00:00 女',
    input: { year: 1978, month: 11, day: 7, hour: 0, minute: 0, gender: 'female' },
    expect: { year: '무오', month: '임술' },
    note: '입동 11/8 03:34 전 → 戌月',
  },
  {
    name: '회귀 2000-01-01 12:00 男',
    input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: 'male' },
    expect: { year: '기묘', month: '병자' },
    note: '1/1 = 입춘 전, 명리학적 1999년',
  },
];

describe('만세력 verify — 12건 (sajutalk + KASI + DST 검증된 정답)', () => {
  for (const c of CASES) {
    test(c.name, () => {
      const r = computeManse(c.input);
      expect(r.yearPillar, `년주 — ${c.note ?? ''}`).toBe(c.expect.year);
      if (c.expect.month) {
        expect(r.monthPillar, `월주 — ${c.note ?? ''}`).toBe(c.expect.month);
      }
      if (c.expect.day) {
        expect(r.dayPillar, `일주 — ${c.note ?? ''}`).toBe(c.expect.day);
      }
      if (c.expect.hour) {
        expect(r.hourPillar, `시주 — ${c.note ?? ''}`).toBe(c.expect.hour);
      }
    });
  }
});
