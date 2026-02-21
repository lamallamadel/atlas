# Accessibility Testing Pipeline - Quick Start Guide

This guide helps you quickly set up and run the automated accessibility testing pipeline.

## Prerequisites

- Node.js 18+
- Git
- Docker (for CI/CD)

## Setup (One-time)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Initialize Git hooks
npm run prepare

# Install Playwright browsers
npx playwright install chromium
```

## Running Tests

### 1. Local Pre-commit Checks

Start the dev server in one terminal:
```bash
cd frontend
npm start
```

In another terminal, make changes and commit:
```bash
git add .
git commit -m "Your changes"
```

The pre-commit hook will automatically run accessibility checks. If violations are found, the commit will be blocked.

**To bypass (use sparingly):**
```bash
git commit --no-verify -m "Your changes"
```

### 2. Manual Accessibility Tests

Run all accessibility E2E tests:
```bash
cd frontend
npm run e2e:a11y
```

View reports:
```bash
open a11y-reports/*.html
```

### 3. Lighthouse CI

Run Lighthouse performance and accessibility audit:
```bash
cd frontend
npm run lighthouse:ci
```

View reports:
```bash
open .lighthouseci/*.html
```

## Understanding Results

### Performance Budgets

| Metric | Budget | Status |
|--------|--------|--------|
| FCP | < 1800ms | ✅ Pass / ❌ Fail |
| LCP | < 2500ms | ✅ Pass / ❌ Fail |
| TTI | < 3800ms | ✅ Pass / ❌ Fail |
| Accessibility | ≥ 95% | ✅ Pass / ❌ Fail |

### Violation Severity

- **Critical** 🔴 - Blocks commit, must fix immediately
- **Serious** 🟠 - Blocks commit, must fix before merge
- **Moderate** 🔵 - Warning, fix soon (≤ 5 allowed)
- **Minor** ⚪ - Informational, fix when possible

## Common Fixes

### Color Contrast Issues

```html
<!-- Bad: Low contrast -->
<button style="color: #ccc; background: #fff">Submit</button>

<!-- Good: High contrast -->
<button style="color: #000; background: #fff">Submit</button>
```

### Missing Alt Text

```html
<!-- Bad: Missing alt text -->
<img src="logo.png">

<!-- Good: Descriptive alt text -->
<img src="logo.png" alt="Company Logo">
```

### Missing Form Labels

```html
<!-- Bad: No label -->
<input type="text" placeholder="Name">

<!-- Good: Proper label -->
<label for="name">Name</label>
<input id="name" type="text">
```

### Missing ARIA Labels

```html
<!-- Bad: No accessible name -->
<button (click)="close()">×</button>

<!-- Good: ARIA label -->
<button (click)="close()" aria-label="Close dialog">×</button>
```

## CI/CD Integration

The pipeline automatically runs on every PR:

1. **Lighthouse CI** - Performance and accessibility audit
2. **axe-core E2E Tests** - Comprehensive accessibility scan

Results are posted as PR comments with detailed breakdowns.

## Troubleshooting

### "Development server not running"

Start the dev server:
```bash
cd frontend
npm start
```

### "axe is not defined"

Clear cache and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Pre-commit hook not running"

Reinitialize hooks:
```bash
cd frontend
npm run prepare
```

On Unix/Mac:
```bash
chmod +x .husky/pre-commit
```

### Tests failing locally but passing in CI

Ensure you're using the same versions:
```bash
cd frontend
npm ci  # Use exact versions from package-lock.json
```

## Learn More

- Full documentation: [frontend/ACCESSIBILITY_TESTING.md](frontend/ACCESSIBILITY_TESTING.md)
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- axe-core Rules: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md

## Quick Commands Reference

```bash
# Run all accessibility tests
npm run e2e:a11y

# Run Lighthouse CI
npm run lighthouse:ci

# Run pre-commit checks manually
npm run a11y:pre-commit

# Bypass pre-commit (emergency only)
git commit --no-verify

# View HTML reports
open a11y-reports/*.html
open .lighthouseci/*.html
```

## Support

If you encounter issues:

1. Check the HTML reports for detailed violation information
2. Review the troubleshooting section in [ACCESSIBILITY_TESTING.md](frontend/ACCESSIBILITY_TESTING.md)
3. Consult WCAG guidelines for specific accessibility requirements
