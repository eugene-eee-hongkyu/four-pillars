import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'lib/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',           // Playwright E2E는 vitest 제외
      'lib/manse/verify.spec.ts', // sajutalk Playwright 패턴 (외부 포스텔러 의존)
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
