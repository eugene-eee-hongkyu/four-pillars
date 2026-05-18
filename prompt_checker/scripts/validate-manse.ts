// 만세력 라이브러리 4대 변수 검증
//
// 사용법: npm run validate-manse
//
// 검증 대상:
//   1. 자시 처리법 (야자시/조자시 분리 vs 정자시 통합)
//   2. 진태양시 보정 (KST −32분)
//   3. 서머타임 보정 (1948-51, 1955-60, 1987-88)
//   4. 절기 입절시각 정밀도 (분 단위)

import { calculateSaju } from '@fullstackfamily/manseryeok';

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function run(name: string, fn: () => { passed: boolean; detail: string }) {
  try {
    const r = fn();
    results.push({ name, ...r });
  } catch (e) {
    results.push({ name, passed: false, detail: `예외: ${(e as Error).message}` });
  }
}

function fmt(saju: ReturnType<typeof calculateSaju>): string {
  return `년:${saju.yearPillar} 월:${saju.monthPillar} 일:${saju.dayPillar} 시:${saju.hourPillar} (보정:${saju.isTimeCorrected ? 'O' : 'X'}, 보정시:${saju.correctedTime?.hour ?? '-'}:${saju.correctedTime?.minute ?? '-'})`;
}

// ─── 1. 자시 처리법 ───────────────────────────────────────────
// 1990-01-15 출생자 4건을 비교해서 일주 변경 시점 추정
run('1-A. 자시 — 23:00 출생 (자시 전, 해시)', () => {
  const r = calculateSaju(1990, 1, 15, 23, 0);
  return { passed: true, detail: fmt(r) };
});
run('1-B. 자시 — 23:45 출생 (자시 안)', () => {
  const r = calculateSaju(1990, 1, 15, 23, 45);
  return { passed: true, detail: fmt(r) };
});
run('1-C. 자시 — 다음날 00:30 출생', () => {
  const r = calculateSaju(1990, 1, 16, 0, 30);
  return { passed: true, detail: fmt(r) };
});
run('1-D. 자시 — 다음날 02:00 출생 (축시)', () => {
  const r = calculateSaju(1990, 1, 16, 2, 0);
  return { passed: true, detail: fmt(r) };
});
// A의 일주와 B의 일주를 비교 → 자정 전(23:45) 일주가 어느 날 기준인지 판정
// B와 C 비교 → 자정 통과 시 일주 바뀌는지

// ─── 2. 진태양시 보정 ─────────────────────────────────────────
// 12:00 KST 입력 시 보정 시각이 11:28인지 (한국 표준 −32분)
run('2-A. 진태양시 — 12:00 KST 출생', () => {
  const r = calculateSaju(2000, 6, 15, 12, 0);
  const corrected = r.correctedTime;
  if (!corrected) return { passed: false, detail: `correctedTime 없음. raw: ${fmt(r)}` };
  const expectedMin = 28; // 12:00 - 32분 = 11:28
  const expectedHour = 11;
  const passed = corrected.hour === expectedHour && Math.abs(corrected.minute - expectedMin) <= 2;
  return {
    passed,
    detail: `입력 12:00 → 보정 ${corrected.hour}:${corrected.minute} (기대 ${expectedHour}:${expectedMin}±2). ${fmt(r)}`,
  };
});

// ─── 3. 서머타임 보정 ─────────────────────────────────────────
// 1988-08-15는 서머타임 적용 시기 (1987.05.10 ~ 1988.10.08)
// 12:30 표시시각 → 보정 시 11:30 → 진태양시 10:58 → 사(巳)시
// 보정 미적용 시 12:30 → 진태양시 11:58 → 오(午)시
// 1986-08-15는 서머타임 비적용 → 12:30 → 진태양시 11:58 → 오(午)시
run('3-A. 서머타임 — 1988-08-15 12:30 (서머타임 시기)', () => {
  const r = calculateSaju(1988, 8, 15, 12, 30);
  return { passed: true, detail: fmt(r) };
});
run('3-B. 서머타임 비교 — 1986-08-15 12:30 (서머타임 X)', () => {
  const r = calculateSaju(1986, 8, 15, 12, 30);
  return { passed: true, detail: fmt(r) };
});
run('3-C. 서머타임 — 1988-07-01 11:30 (서머타임 중간)', () => {
  const r = calculateSaju(1988, 7, 1, 11, 30);
  return { passed: true, detail: fmt(r) };
});
run('3-D. 서머타임 — 1987-09-01 11:30 (서머타임 중간)', () => {
  const r = calculateSaju(1987, 9, 1, 11, 30);
  return { passed: true, detail: fmt(r) };
});

// ─── 4. 절기 입절시각 정밀도 ──────────────────────────────────
// 2024년 입춘 = 2024-02-04 17:27 KST (KASI 공식)
// 17:00 출생 → 입춘 전 → 월주는 1월절(丁丑)
// 18:00 출생 → 입춘 후 → 월주는 2월절(戊寅, 立春 시작)
run('4-A. 절기 — 2024-02-04 17:00 (입춘 27분 전)', () => {
  const r = calculateSaju(2024, 2, 4, 17, 0);
  const passed = r.monthPillar === '정축'; // 입춘 전 = 丁丑(1월절)
  return {
    passed,
    detail: `월주 ${r.monthPillar} (기대 정축, 입춘 전). ${fmt(r)}`,
  };
});
run('4-B. 절기 — 2024-02-04 18:00 (입춘 33분 후)', () => {
  const r = calculateSaju(2024, 2, 4, 18, 0);
  const passed = r.monthPillar === '병인'; // 입춘 후 = 丙寅(2월절, 갑년 기준 입춘 후 첫 인월)
  return {
    passed,
    detail: `월주 ${r.monthPillar} (기대 병인, 입춘 후). ${fmt(r)}`,
  };
});

// ─── 출력 ─────────────────────────────────────────────────────
console.log('\n=== 만세력 라이브러리 검증 ===\n');
for (const r of results) {
  const icon = r.passed ? '✓' : '✗';
  console.log(`${icon} ${r.name}`);
  console.log(`   ${r.detail}\n`);
}

// 분석 출력
console.log('=== 분석 ===\n');
console.log('자시 처리법 (1-A ~ 1-D 일주 비교):');
console.log('  - A(23:00, 자시 전)와 B(23:45, 자시 안)의 일주가 다르면 → 자시 시작 시점에 일주 변경 (야자시 분리파)');
console.log('  - A와 B가 같고 C(자정 후)와 다르면 → 자정 기준 일주 변경 (정자시 자정파)');
console.log('  - 모두 다른 패턴이면 별도 학파 적용');
console.log();
console.log('진태양시 (2-A): 보정 결과가 11:28(±2)이면 통과');
console.log();
console.log('서머타임 (3-A vs 3-B): 같은 12:30 출생이지만 1988(서머타임 O) vs 1986(X) 비교');
console.log('  - 시주 또는 보정시각이 다르면 → 서머타임 자동 적용됨');
console.log('  - 같으면 → 서머타임 보정 미적용 (수동 보정 필요)');
console.log();
console.log('절기 (4-A, 4-B): 입춘 ±33분에서 월주가 갈리면 분 단위 정밀도 OK');

const failed = results.filter(r => !r.passed).length;
console.log(`\n총 ${results.length}건, 실패 ${failed}건`);
process.exit(failed > 0 ? 1 : 0);
