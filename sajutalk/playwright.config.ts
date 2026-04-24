import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['lib/manse/verify.spec.ts', 'tests/**/*.spec.ts'],
  timeout: 120_000,
  retries: 0,
  use: {
    headless: true,
    locale: 'ko-KR',
  },
});
