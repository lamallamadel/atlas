# E2E Tests with Playwright

This directory contains end-to-end tests for the frontend application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run e2e
```

### Run tests in headed mode (see browser)
```bash
npm run e2e:headed
```

### Run tests in UI mode (interactive)
```bash
npm run e2e:ui
```

### Run specific test file
```bash
npx playwright test dossier-message.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Scenarios

### Scenario 1: Message Creation Flow (dossier-message.spec.ts)
Tests the complete flow of:
1. Login → Navigate to dossiers list
2. Open a dossier detail page
3. Switch to Messages tab
4. Add a new message
5. Verify the message appears in the timeline with correct:
   - Timestamp
   - Channel (EMAIL, SMS, etc.)
   - Direction (INBOUND/OUTBOUND)
   - Content

### Scenario 2: Appointment Creation and Audit (dossier-appointment.spec.ts)
Tests the complete flow of:
1. Open a dossier
2. Switch to Rendez-vous (Appointments) tab
3. Add a new appointment
4. Verify the appointment appears in the list
5. Switch to Historique (Audit) tab
6. Verify audit event for appointment creation with:
   - action=CREATE (or CREATED)
   - entityType=APPOINTMENT (or related)

## Test Structure

- `auth.fixture.ts` - Authentication fixture that automatically logs in before each test
- `helpers.ts` - Common helper functions for navigation, form filling, etc.
- `*.spec.ts` - Test specification files

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the frontend directory.

Key configuration:
- Base URL: http://localhost:4200
- Browsers: Chromium, Firefox, WebKit
- Auto-start dev server before tests
- Screenshots on failure
- Trace on first retry

## Debugging

### Debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

### Generate trace for failed tests
Traces are automatically generated on first retry. View them with:
```bash
npx playwright show-trace trace.zip
```

## CI/CD

Tests are configured to run in CI mode when the `CI` environment variable is set:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- forbidOnly: true (prevents `.only` from being committed)

## Best Practices

1. Use data-testid attributes for stable selectors (recommended for production)
2. Wait for explicit conditions rather than fixed timeouts
3. Clean up test data after tests when possible
4. Use the authentication fixture to avoid repetitive login steps
5. Keep tests independent - each test should work in isolation

## Troubleshooting

### Test fails with "Timeout waiting for..."
- Increase timeout in the test or config
- Check if the application is running correctly
- Verify selectors are correct

### Authentication issues
- Check that the mock login button is available
- Verify the auth fixture is working correctly
- Check browser console for errors

### Element not found
- Use Playwright Inspector to debug selectors: `npx playwright test --debug`
- Try multiple selector strategies (text, role, test-id)
- Check if element is in a shadow DOM or iframe
