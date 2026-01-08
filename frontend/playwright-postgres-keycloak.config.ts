import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests with PostgreSQL + Keycloak auth
 * - Backend runs with e2e-postgres-keycloak profile (PostgreSQL + real Keycloak)
 * - Requires PostgreSQL and Keycloak to be running
 * - Tests must handle real authentication flow
 * - This is the most complete integration test configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['junit', { outputFile: 'test-results/junit-postgres-keycloak.xml' }], ['json', { outputFile: 'test-results/results-postgres-keycloak.json' }]] : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
