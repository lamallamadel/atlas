import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Playwright config for E2E tests with H2 + mock auth (default, fastest)
 * - Backend runs with default test profile (H2 + mock JWT)
 * - Uses globalSetup to create a storageState with a mock token
 * - No external dependencies required (no PostgreSQL or Keycloak)
 * - Stabilized with retry logic, proper waits, and screenshot capture
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: process.env.CI 
    ? [
        ['html', { outputFolder: 'test-results/html-report' }], 
        ['junit', { outputFile: 'test-results/junit.xml' }], 
        ['json', { outputFile: 'test-results/results.json' }],
        ['list']
      ] 
    : [['html'], ['list']],
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    storageState: 'e2e/.auth/storageState.json',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  outputDir: 'test-results/artifacts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 240000,
  },
});
