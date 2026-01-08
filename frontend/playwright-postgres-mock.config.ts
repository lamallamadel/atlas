import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests with PostgreSQL + mock auth
 * - Uses globalSetup to create a storageState with a mock token + org id
 * - Backend runs with e2e-postgres-mock profile (PostgreSQL + mock JWT)
 * - Requires docker-compose.e2e-postgres.yml to be running
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['junit', { outputFile: 'test-results/junit-postgres-mock.xml' }], ['json', { outputFile: 'test-results/results-postgres-mock.json' }]] : 'html',
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'e2e/.auth/storageState.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 240000,
  },
});
