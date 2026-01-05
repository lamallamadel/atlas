# E2E Test Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm 8+ installed
- Backend application running (Spring Boot on port 8080)
- Frontend application dependencies installed

## Initial Setup

### 1. Install Dependencies

From the `frontend` directory:

```bash
npm install
```

This will install Playwright and all required dependencies from `package.json`.

### 2. Install Playwright Browsers

```bash
npx playwright install
```

This downloads the browser binaries for Chromium, Firefox, and WebKit.

If you only want to test on Chromium:

```bash
npx playwright install chromium
```

### 3. Verify Setup

Run a simple test to verify everything is working:

```bash
npx playwright test --project=chromium dossier-message.spec.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run e2e

# Run tests in headed mode (see the browser)
npm run e2e:headed

# Run tests in UI mode (interactive debugging)
npm run e2e:ui

# Run specific test file
npx playwright test dossier-message.spec.ts

# Run specific test by name
npx playwright test -g "Scenario 1"

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debugging Commands

```bash
# Run in debug mode (step through tests)
npx playwright test --debug

# Run with Playwright Inspector
npx playwright test --debug dossier-message.spec.ts

# Generate trace for debugging
npx playwright test --trace on

# Show last test report
npx playwright show-report
```

## Configuration

### playwright.config.ts

Key configuration options:

```typescript
{
  baseURL: 'http://localhost:4200',  // Frontend URL
  timeout: 30000,                     // Default timeout
  retries: 0,                         // Retry failed tests
  workers: undefined,                 // Parallel workers (auto)
  
  use: {
    trace: 'on-first-retry',         // Trace on failures
    screenshot: 'only-on-failure',   // Screenshots
    video: 'retain-on-failure'       // Videos
  }
}
```

### Environment Variables

```bash
# Run in CI mode
CI=true npm run e2e

# Change base URL
PLAYWRIGHT_BASE_URL=http://localhost:4200 npm run e2e

# Run headed in CI
HEADED=true npm run e2e
```

## Project Structure

```
frontend/e2e/
├── pages/                          # Page Object Models
│   ├── login.page.ts
│   ├── dossiers-list.page.ts
│   └── dossier-detail.page.ts
├── auth.fixture.ts                 # Authentication fixture
├── helpers.ts                      # Utility functions
├── dossier-message.spec.ts         # Message tests
├── dossier-appointment.spec.ts     # Appointment tests
├── dossier-full-workflow.spec.ts   # Combined workflow
├── dossier-pom.spec.ts            # POM examples
├── README.md                       # Quick reference
├── SETUP_GUIDE.md                 # This file
├── TEST_SCENARIOS.md              # Test documentation
└── ci-example.yml                 # CI/CD example
```

## Backend Setup for E2E Tests

### Requirements

1. Backend must be running on http://localhost:8080
2. Database must be accessible
3. Test organization (ORG-001) must exist

### Starting Backend

```bash
cd backend
mvn spring-boot:run
```

Or with specific profile:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Database Setup

Ensure your database is running and accessible:

```bash
cd infra
docker-compose up -d postgres
```

## Frontend Setup for E2E Tests

### Requirements

1. Frontend must be accessible on http://localhost:4200
2. Backend proxy must be configured
3. Mock authentication must be enabled

### Starting Frontend

```bash
cd frontend
npm run start
```

This starts the dev server with proxy configuration.

### Proxy Configuration

The `proxy.conf.json` should redirect API calls to backend:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

## Authentication Setup

Tests use the authentication fixture (`auth.fixture.ts`) which:

1. Navigates to `/login`
2. Fills in org ID (ORG-001)
3. Clicks "Mock Login" button
4. Waits for redirect to `/dashboard`

### Mock Login Requirements

The login page must have:
- Input field with placeholder containing "ID Organisation"
- Button with text "Mock Login"
- Successful login redirects to `/dashboard`

## Troubleshooting

### Issue: "Timeout waiting for page to navigate"

**Solution**:
1. Check backend is running: `curl http://localhost:8080/actuator/health`
2. Check frontend is running: `curl http://localhost:4200`
3. Check browser console for errors
4. Increase timeout in config

### Issue: "Target closed" error

**Solution**:
1. Browser crashed - check system resources
2. Add `--headed` to see what's happening
3. Check for infinite loops or memory leaks

### Issue: "Element not found"

**Solution**:
1. Use Playwright Inspector: `npx playwright test --debug`
2. Check element exists in DOM
3. Check if element is in shadow DOM
4. Try alternative selectors
5. Add wait conditions

### Issue: "Authentication failed"

**Solution**:
1. Check login page is accessible
2. Verify mock login button exists
3. Check localStorage is working
4. Verify token is set correctly

### Issue: Tests fail in CI but pass locally

**Solution**:
1. Set `CI=true` locally to test
2. Check timing issues (add waits)
3. Check resource constraints
4. Review CI logs and traces
5. Check database state in CI

## Best Practices

### 1. Use Page Objects

```typescript
// Good
const dossiersPage = new DossiersListPage(page);
await dossiersPage.goto();
await dossiersPage.createDossier('Name', 'Phone');

// Avoid
await page.goto('/dossiers');
await page.locator('button:has-text("Créer")').click();
```

### 2. Wait for Explicit Conditions

```typescript
// Good
await page.waitForSelector('.message-card');
await expect(page.locator('.message-card')).toBeVisible();

// Avoid
await page.waitForTimeout(5000);
```

### 3. Use Data Test IDs

```html
<!-- Good -->
<button data-testid="create-message-btn">Create</button>

<!-- Then in test -->
await page.locator('[data-testid="create-message-btn"]').click();
```

### 4. Keep Tests Independent

Each test should:
- Set up its own data
- Not depend on other tests
- Clean up after itself (optional)
- Work in any order

### 5. Use Fixtures for Common Setup

```typescript
// Good - use fixture
test('my test', async ({ page }) => {
  // Already authenticated
});

// Avoid - manual login
test('my test', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input').fill('...');
  // ...
});
```

## Performance Tips

1. **Run tests in parallel**: Use multiple workers
   ```bash
   npx playwright test --workers=4
   ```

2. **Run only changed tests**: Use test filtering
   ```bash
   npx playwright test dossier-message
   ```

3. **Reuse authentication state**: Use fixtures

4. **Skip slow tests in development**:
   ```typescript
   test.skip('slow test', async ({ page }) => {
     // ...
   });
   ```

5. **Use headed mode only when debugging**

## CI/CD Integration

See `ci-example.yml` for GitHub Actions example.

Key points:
- Set `CI=true` environment variable
- Install Playwright with deps: `npx playwright install --with-deps`
- Start backend before tests
- Upload artifacts on failure
- Set appropriate timeouts

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

## Getting Help

1. Check Playwright documentation
2. Review test output and traces
3. Use Playwright Inspector for debugging
4. Check this repository's issues
5. Ask the team on Slack/Teams

## Maintenance Schedule

- **Weekly**: Review failed tests, update selectors if needed
- **Monthly**: Update Playwright version, review test coverage
- **Quarterly**: Review test performance, refactor as needed
- **Yearly**: Review test strategy, add new scenarios
