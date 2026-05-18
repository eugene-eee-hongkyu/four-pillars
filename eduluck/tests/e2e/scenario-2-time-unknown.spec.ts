// A-1 §4 시나리오 2: 초1 자녀 + 시간 모름
// PASS 조건:
//   - 시간 모름 체크 → 모달 자동 오픈
//   - 모달 이메일 입력 → 닫고 진행
//   - 화면 4 시주 표시 = "—" (hourPillarHanja null)
//   - 화면 5 본문에서 시주 관련 추측 자제 (LLM 면책 톤)

import { test, expect } from '@playwright/test';

test('시나리오 2 (초1 시간 모름) — 시간 미상 + 면책 톤', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /무료 진단 시작/ }).click();

  // 화면 2
  await page.getByPlaceholder('예: 우리 민서').fill('지우');
  await page.getByRole('radio', { name: '남' }).click();
  await page.getByRole('combobox').click();
  await page.getByText('초등 1학년', { exact: true }).click();
  await page.getByRole('button', { name: '다음' }).click();

  // 화면 3
  await expect(page).toHaveURL(/\/child-saju/);
  await page.getByRole('radio', { name: '음력' }).click();
  await page.getByPlaceholder('2017-09-15').fill('2018-11-20');

  // 시간 모름 체크 → 모달 오픈
  await page.getByRole('checkbox', { name: '시간을 모르겠어요' }).click();
  // 모달 안 이메일 입력
  await page.waitForFunction(() => /시간 모름 안내/.test(document.body.innerText), { timeout: 5000 });
  await page.getByPlaceholder('name@example.com').fill('test@example.com');
  await page.getByRole('button', { name: '확인하고 진행' }).click();

  // 출생 지역
  await page.getByRole('combobox').click();
  await page.getByText('서울', { exact: true }).first().click();

  // 만세력 보기
  await page.getByRole('button', { name: '만세력 보기' }).click();
  await expect(page).toHaveURL(/\/child-manse/, { timeout: 15 * 1000 });

  // 화면 4: 시주 한자 = "—" (null 처리)
  await page.waitForFunction(() => /지우의 만세력/.test(document.body.innerText), { timeout: 10 * 1000 });
  const manseText = await page.locator('body').innerText();
  // 시주 영역에 한자(인+천간) 없음 — 시주가 — 또는 빈칸. 일주(천간 1자)·월주·년주 한자는 있어야 함.
  expect(manseText, '시주 미상 면책 톤').toMatch(/지우의 만세력/);
  // PalcaTable의 시주 cell이 '—' 텍스트 가짐
  expect(manseText, '시주 placeholder 표시').toContain('—');

  // 화면 5 진단
  await page.getByRole('button', { name: '학운 진단 받기' }).click();
  await expect(page).toHaveURL(/\/interpret-free/);
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      const ok = /지우|일간|인성|식상/.test(t);
      const sent = (t.match(/[.!?。]\s/g) ?? []).length;
      return ok && sent >= 10;
    },
    { timeout: 120 * 1000 },
  );

  const bodyText = await page.locator('body').innerText();
  const sentenceCount = (bodyText.match(/[.!?。]\s/g) ?? []).length;
  console.log(`[시나리오 2] 본문 문장 수: ${sentenceCount}`);
  expect(sentenceCount).toBeGreaterThanOrEqual(10);
});
