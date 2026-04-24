/**
 * 만세력 검증: @fullstackfamily/manseryeok vs 포스텔러(pro.forceteller.com)
 * B §5 8번 — 반드시 UI 작업 전에 통과해야 함
 *
 * 실행: npx playwright test lib/manse/verify.spec.ts --headed
 *
 * 시간 선택 기준: 서울 지역시 보정(-32분) 후에도 동일 시주에 속하는 짝수 시간만 사용.
 * 홀수 시간(시주 경계)은 보정 후 시주가 달라질 수 있으므로 제외.
 */
import { test, expect } from '@playwright/test';
import { calculateSaju } from '@fullstackfamily/manseryeok';

interface TestCase {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
  label: string;
}

const TEST_CASES: TestCase[] = [
  { year: 1990, month: 5,  day: 15, hour: 14, gender: 'male',   label: '1990-05-15 14시 남' },
  { year: 1985, month: 2,  day: 3,  hour: 22, gender: 'female', label: '1985-02-03 22시 여' },
  { year: 1995, month: 8,  day: 20, hour: 6,  gender: 'male',   label: '1995-08-20 06시 남' },
  { year: 1978, month: 11, day: 7,  hour: 0,  gender: 'female', label: '1978-11-07 00시 여' },
  { year: 2000, month: 1,  day: 1,  hour: 12, gender: 'male',   label: '2000-01-01 12시 남' },
  { year: 1968, month: 7,  day: 25, hour: 18, gender: 'female', label: '1968-07-25 18시 여' },
  { year: 1983, month: 3,  day: 30, hour: 10, gender: 'male',   label: '1983-03-30 10시 남' },
  { year: 1999, month: 12, day: 31, hour: 20, gender: 'female', label: '1999-12-31 20시 여' },
  { year: 1955, month: 4,  day: 10, hour: 4,  gender: 'male',   label: '1955-04-10 04시 남' },
  { year: 2003, month: 9,  day: 18, hour: 16, gender: 'female', label: '2003-09-18 16시 여' },
];

function getLibResult(tc: TestCase) {
  const raw = calculateSaju(tc.year, tc.month, tc.day, tc.hour, 0, tc.gender);
  return {
    year: raw.yearPillar,
    month: raw.monthPillar,
    day: raw.dayPillar,
    hour: raw.hourPillar,
  };
}

async function extractPillars(page: Parameters<Parameters<typeof test>[2]>[0]['page']) {
  const chars: string[] = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const stemRegex = /^[갑을병정무기경신임계][甲乙丙丁戊己庚辛壬癸]$/;
    const branchRegex = /^[자축인묘진사오미신유술해][子丑寅卯辰巳午未申酉戌亥]$/;
    const found: string[] = [];
    while (walker.nextNode()) {
      const text = (walker.currentNode.textContent ?? '').trim();
      if (stemRegex.test(text) || branchRegex.test(text)) {
        found.push(text[0]);
      }
    }
    return found;
  });

  // 페이지에 동일 그리드 3회 렌더 — 첫 8개(시주·일주·월주·년주 순)만 사용
  expect(chars.length, '사주 글자 추출 실패 — 그리드 미발견').toBeGreaterThanOrEqual(8);
  const [hourStem, hourBranch, dayStem, dayBranch, monthStem, monthBranch, yearStem, yearBranch] = chars;
  return {
    year:  yearStem  + yearBranch,
    month: monthStem + monthBranch,
    day:   dayStem   + dayBranch,
    hour:  hourStem  + hourBranch,
  };
}

test.describe('만세력 검증 — @fullstackfamily/manseryeok vs 포스텔러', () => {
  test.setTimeout(120_000);

  for (const tc of TEST_CASES) {
    test(tc.label, async ({ page }) => {
      const lib = getLibResult(tc);
      console.log(`[라이브러리] ${tc.label}: 년=${lib.year} 월=${lib.month} 일=${lib.day} 시=${lib.hour}`);

      await page.goto('https://pro.forceteller.com/profile/edit', { waitUntil: 'networkidle' });

      // 이름
      await page.locator('input[name="name"]').click();
      await page.locator('input[name="name"]').pressSequentially('테스트');

      // 성별 (페이지 기본값: 여자 — 남자만 클릭 필요)
      if (tc.gender === 'male') {
        await page.getByText('남자', { exact: true }).click();
      }

      // 생년월일
      const birthday = `${tc.year}/${String(tc.month).padStart(2, '0')}/${String(tc.day).padStart(2, '0')}`;
      await page.locator('input[name="birthday"]').click();
      await page.locator('input[name="birthday"]').pressSequentially(birthday);

      // 생시
      const birthtime = `${String(tc.hour).padStart(2, '0')}:00`;
      await page.locator('input[name="birthtime"]').click();
      await page.locator('input[name="birthtime"]').pressSequentially(birthtime);

      // 도시 검색
      await page.getByRole('group').filter({ hasText: '도시' }).getByRole('button').click();
      await page.getByRole('dialog').waitFor({ timeout: 5000 });
      await page.getByRole('textbox', { name: '시군구 단위로 검색' }).pressSequentially('서울');
      await page.getByRole('dialog').getByRole('button').last().click();
      await page.getByRole('listitem').first().waitFor({ timeout: 5000 });
      await page.getByRole('listitem').first().click();
      await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 });

      // 만세력 보러가기 (edit → confirm)
      await page.getByRole('button', { name: '만세력 보러가기' }).click();
      await page.waitForURL('**/profile/confirm', { timeout: 10_000 });
      // React 비동기 context 업데이트 대기 — "프로필 수정하기" 버튼이 나타야 진짜 confirm 페이지
      await page.getByRole('button', { name: '프로필 수정하기' }).waitFor({ timeout: 30_000 });

      // 만세력 보러가기 (confirm → result)
      await Promise.all([
        page.waitForURL('**/result', { timeout: 30_000 }),
        page.getByRole('button', { name: '만세력 보러가기' }).click(),
      ]);
      // 클라이언트 사이드 사주 계산 완료 대기
      await page.waitForFunction(
        () => /[갑을병정무기경신임계][甲乙丙丁戊己庚辛壬癸]/.test(document.body.innerText),
        { timeout: 15_000 },
      );

      const scr = await extractPillars(page);
      console.log(`[포스텔러] 년=${scr.year} 월=${scr.month} 일=${scr.day} 시=${scr.hour}`);
      console.log(`[비교] 년: ${lib.year === scr.year ? '✓' : `✗ lib:${lib.year} ft:${scr.year}`}`);
      console.log(`[비교] 월: ${lib.month === scr.month ? '✓' : `✗ lib:${lib.month} ft:${scr.month}`}`);
      console.log(`[비교] 일: ${lib.day === scr.day ? '✓' : `✗ lib:${lib.day} ft:${scr.day}`}`);
      console.log(`[비교] 시: ${lib.hour === scr.hour ? '✓' : `✗ lib:${lib.hour} ft:${scr.hour}`}`);

      expect(lib.year,  `년주 불일치 — ${tc.label}`).toBe(scr.year);
      expect(lib.month, `월주 불일치 — ${tc.label}`).toBe(scr.month);
      expect(lib.day,   `일주 불일치 — ${tc.label}`).toBe(scr.day);
      expect(lib.hour,  `시주 불일치 — ${tc.label}`).toBe(scr.hour);
    });
  }
});
