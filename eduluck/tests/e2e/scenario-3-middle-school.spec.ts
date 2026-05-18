// A-1 §4 시나리오 3: 중2 자녀 (Mid-grade)
// PASS 조건:
//   - 학년 "중2" 선택 → child-info 진행
//   - 화면 5 본문에 중학년 키워드 (특목고|일반고|진로|과목|친구) 등장
//   - 전공·학교 예측 미노출 (고등 아님)

import { test, expect } from '@playwright/test';

test('시나리오 3 (중2) — 학년대별 톤 분기', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /무료 진단 시작/ }).click();

  // 화면 2
  await page.getByPlaceholder('예: 우리 민서').fill('준호');
  await page.getByRole('radio', { name: '남' }).click();
  await page.getByRole('combobox').click();
  await page.getByText('중학교 2학년', { exact: true }).click();
  await page.getByRole('button', { name: '다음' }).click();

  // 화면 3
  await expect(page).toHaveURL(/\/child-saju/);
  await page.getByPlaceholder('2017-09-15').fill('2012-04-10');
  await page.getByPlaceholder('14:30').fill('22:15');
  await page.getByRole('combobox').click();
  await page.getByText('인천', { exact: true }).first().click();
  await page.getByRole('button', { name: '만세력 보기' }).click();

  await expect(page).toHaveURL(/\/child-manse/, { timeout: 15 * 1000 });
  await page.getByRole('button', { name: '학운 진단 받기' }).click();

  // 화면 5 SSE
  await expect(page).toHaveURL(/\/interpret-free/);
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      const ok = /준호|일간|인성|식상/.test(t);
      const sent = (t.match(/[.!?。]\s/g) ?? []).length;
      return ok && sent >= 13;
    },
    { timeout: 120 * 1000 },
  );

  const bodyText = await page.locator('body').innerText();

  // 중학년 키워드 매칭
  const middleKeywords = /(특목고|일반고|진로|과목|친구|영재|학원|진학)/;
  const hasMiddle = middleKeywords.test(bodyText);
  console.log(`[시나리오 3] 중학년 키워드 매칭: ${hasMiddle}`);
  expect(hasMiddle, `중학년 키워드 매칭 필요 (${middleKeywords.source})`).toBe(true);

  // 고등 학년 전용 전공·학교 예측 미노출
  // 간이 진단(화면 5)에는 정밀(화면 11) 전용 전공·학교 예측이 없어야 함
  const noUnivPrediction = !/중앙대|서울대|연세대|고려대|전공 예측|학교 예측/.test(bodyText);
  console.log(`[시나리오 3] 전공·학교 예측 미노출: ${noUnivPrediction}`);
  expect(noUnivPrediction).toBe(true);
});
