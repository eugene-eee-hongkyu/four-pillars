// A-1 §4 시나리오 1: 초3 자녀 둔 35세 어머니 (Best case)
// 화면 1→4 자동 PASS + 화면 5 SSE 본문 분량 ≥ 13문장 검증.
// 회원가입(화면 7) 이후는 OTP 자동화 v1.5로 미룸 — 본 시나리오는 anon 흐름만.

import { test, expect } from '@playwright/test';

test('시나리오 1 (초3 best case) — 화면 1→5 자동', async ({ page }) => {
  // ─── 화면 1: 랜딩 ──────────────────────────────────────
  await page.goto('/');
  await expect(page.getByRole('button', { name: /무료 진단 시작/ })).toBeVisible();
  await page.getByRole('button', { name: /무료 진단 시작/ }).click();

  // ─── 화면 2: 자녀 기본 정보 ─────────────────────────────
  await expect(page).toHaveURL(/\/child-info/);
  await page.getByPlaceholder('예: 우리 민서').fill('민서');
  await page.getByRole('radio', { name: '여' }).click();
  await page.getByRole('combobox').click();
  await page.getByText('초등 3학년', { exact: true }).click();
  await page.getByRole('button', { name: '다음' }).click();

  // ─── 화면 3: 자녀 사주 입력 ─────────────────────────────
  await expect(page).toHaveURL(/\/child-saju/);
  await page.getByPlaceholder('2017-09-15').fill('2017-09-15');
  await page.getByPlaceholder('14:30').fill('14:30');
  await page.getByRole('combobox').click();
  await page.getByText('서울', { exact: true }).first().click();
  await page.getByRole('button', { name: '만세력 보기' }).click();

  // ─── 화면 4: 자녀 만세력 ────────────────────────────────
  await expect(page).toHaveURL(/\/child-manse/);
  // 일간 을 (乙) + 신살 강조 확인
  await expect(page.getByText('乙', { exact: true })).toBeVisible();
  await expect(page.getByText(/금여성|백호대살/)).toBeVisible();
  await page.getByRole('button', { name: '학운 진단 받기' }).click();

  // ─── 화면 5 ★: 무료 간이 진단 (SSE 스트리밍) ───────────
  await expect(page).toHaveURL(/\/interpret-free/);
  // 본문 도착 + 분량 ≥ 13문장 동시 충족 polling (RN Web visibility 판정 회피)
  await page.waitForFunction(
    () => {
      const t = document.body.innerText;
      if (!/일간|인성|식상|민서/.test(t)) return false;
      const sentences = (t.match(/[.!?。]\s/g) ?? []).length;
      return sentences >= 13;
    },
    { timeout: 120 * 1000 },
  );

  const bodyText = await page.locator('body').innerText();
  const sentenceCount = (bodyText.match(/[.!?。]\s/g) ?? []).length;
  console.log(`[시나리오 1] 본문 문장 수: ${sentenceCount}`);
  expect(sentenceCount, `≥ 13 기대`).toBeGreaterThanOrEqual(13);

  // sticky CTA 노출 (textContent 기반)
  const hasCta = await page.evaluate(() => /어머니 사주 추가/.test(document.body.innerText));
  expect(hasCta, 'sticky CTA "어머니 사주 추가" 누락').toBe(true);
});
