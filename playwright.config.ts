import { defineConfig, devices } from '@playwright/test';
import { PREVIEW_URL } from './e2e/preview-server.ts';

// `astro dev`가 아니라 `astro preview`를 띄운다 — 실제로 Pages에 올라가는
// 빌드 산출물(디렉터리 포맷, 트레일링 슬래시)을 그대로 재현해야 하기 때문이다.
// 그 서버의 생명주기는 webServer가 아니라 e2e/preview-server.ts가 쥔다(사유는 그쪽에).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: PREVIEW_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalSetup: './e2e/preview-server.ts',
});
