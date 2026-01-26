# Accessibility Testing Pipeline

This document describes the automated accessibility testing infrastructure for the Atlas CRM frontend application.

## Overview

The accessibility testing pipeline consists of three main components:

1. **Lighthouse CI** - Performance and accessibility audits on every PR
2. **axe-core E2E Tests** - Comprehensive accessibility tests in Playwright
3. **Pre-commit Hooks** - Local accessibility checks before commits

## Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Performance Budgets](#performance-budgets)
- [Accessibility Standards](#accessibility-standards)
- [CI/CD Integration](#cicd-integration)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Reporting](#reporting)
- [Troubleshooting](#troubleshooting)

## Setup

### Prerequisites

```bash
cd frontend
npm install
```

This installs:
- `@lhci/cli` - Lighthouse CI
- `axe-core` - Accessibility testing engine
- `axe-playwright` - Playwright integration for axe-core
- `@axe-core/playwright` - Additional Playwright support
- `husky` - Git hooks manager

### Initialize Husky

```bash
npm run prepare
```

This sets up Git hooks for pre-commit accessibility checks.

## Running Tests

### Lighthouse CI

Run Lighthouse CI locally:

```bash
npm run lighthouse:ci
```

This will:
- Start the application on `http://localhost:4200`
- Run Lighthouse audits 3 times
- Generate performance and accessibility reports
- Check against defined budgets

### axe-core E2E Tests

Run all accessibility E2E tests:

```bash
npm run e2e:a11y
```

Run specific accessibility test files:

```bash
npx playwright test accessibility-dossier.spec.ts --grep @a11y
npx playwright test accessibility-navigation.spec.ts --grep @a11y
npx playwright test accessibility-annonce.spec.ts --grep @a11y
```

### Pre-commit Checks

Run pre-commit accessibility checks manually:

```bash
npm run a11y:pre-commit
```

**Note:** This requires the development server to be running on port 4200.

## Performance Budgets

Performance budgets are defined in `budget.json`:

### Timing Budgets

| Metric | Budget | Description |
|--------|--------|-------------|
| **FCP** (First Contentful Paint) | < 1800ms | Time until first content appears |
| **LCP** (Largest Contentful Paint) | < 2500ms | Time until main content is visible |
| **TTI** (Time to Interactive) | < 3800ms | Time until page is fully interactive |
| **TBT** (Total Blocking Time) | < 300ms | Sum of blocking time |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability score |
| **Speed Index** | < 3400ms | How quickly content is visually displayed |

### Resource Size Budgets

| Resource Type | Budget |
|---------------|--------|
| JavaScript | 500 KB |
| CSS | 100 KB |
| Images | 300 KB |
| Fonts | 150 KB |
| Total | 2000 KB |

## Accessibility Standards

The pipeline enforces the following accessibility standards:

### WCAG 2.1 Level AA Compliance

Minimum scores required:
- **Accessibility Score**: ≥ 95%
- **Critical Violations**: 0
- **Serious Violations**: 0
- **Moderate Violations**: ≤ 5

### Tested Rules

The following axe-core rules are enforced:

- `color-contrast` - Ensures sufficient color contrast
- `aria-required-attr` - Required ARIA attributes are present
- `aria-valid-attr` - ARIA attributes are valid
- `button-name` - Buttons have accessible names
- `image-alt` - Images have alt text
- `label` - Form inputs have labels
- `link-name` - Links have accessible names
- `heading-order` - Heading levels are in order
- `landmark-one-main` - Page has one main landmark

## CI/CD Integration

### GitHub Actions Workflow

The accessibility CI pipeline runs on every PR:

**File:** `.github/workflows/accessibility-ci.yml`

#### Jobs

1. **lighthouse-ci**
   - Runs Lighthouse CI with performance and accessibility audits
   - Generates reports and comments on PR
   - Fails if budgets are exceeded

2. **axe-e2e-tests**
   - Runs all E2E accessibility tests
   - Generates detailed violation reports
   - Comments results on PR

### PR Comments

The CI automatically comments on PRs with:

#### Lighthouse Results

```
## 🔦 Lighthouse CI Results

| Metric | Score/Value | Target | Status |
|--------|-------------|--------|--------|
| Performance | 85% | ≥70% | ✅ |
| Accessibility | 98% | ≥95% | ✅ |
| FCP | 1500ms | <1800ms | ✅ |
| LCP | 2200ms | <2500ms | ✅ |
| TTI | 3200ms | <3800ms | ✅ |
```

#### Accessibility Test Results

```
## ♿ Accessibility E2E Test Results

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ |
| Serious | 0 | ✅ |
| Moderate | 2 | ✅ |
| Minor | 5 | ℹ️ |

### Top Violations

- **color-contrast** (moderate): Elements must have sufficient color contrast
  - Affected: 2 element(s)
```

## Pre-commit Hooks

Pre-commit hooks run automatically before each commit to catch accessibility issues early.

### Configuration

**File:** `frontend/.husky/pre-commit`

### Behavior

1. Checks if development server is running on port 4200
2. If server is running, runs accessibility checks on critical pages:
   - Dashboard (`/`)
   - Dossiers list (`/dossiers`)
   - Annonces list (`/annonces`)
3. Blocks commit if critical or serious violations are found
4. Allows commit with warnings if only moderate/minor violations exist

### Bypassing Pre-commit Checks

In urgent situations, you can bypass pre-commit checks:

```bash
git commit --no-verify -m "Your commit message"
```

**Note:** This should only be used in exceptional circumstances. Fix violations as soon as possible.

### Disabling Pre-commit Checks

To temporarily disable pre-commit checks:

1. Stop the development server
2. The pre-commit hook will skip accessibility checks

Or remove the hook:

```bash
rm frontend/.husky/pre-commit
```

## Reporting

### Report Locations

All accessibility reports are saved to `frontend/a11y-reports/`:

```
frontend/a11y-reports/
├── pre-commit/           # Pre-commit check reports
│   ├── root.json
│   ├── _dossiers.json
│   └── _annonces.json
├── dossier-list-page.json
├── dossier-list-page.html
├── dashboard-page.json
├── dashboard-page.html
└── summary.json
```

### Report Formats

#### JSON Reports

Detailed violation data in JSON format:

```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Ensures the contrast...",
      "nodes": [
        {
          "html": "<button>Click me</button>",
          "target": [".btn-primary"],
          "failureSummary": "..."
        }
      ]
    }
  ],
  "summary": {
    "total": 3,
    "critical": 0,
    "serious": 1,
    "moderate": 2,
    "minor": 0
  }
}
```

#### HTML Reports

Visual reports with color-coded violations:

- **Critical** - Red background
- **Serious** - Orange background
- **Moderate** - Blue background
- **Minor** - Gray background

Each violation includes:
- Description and help text
- WCAG criteria tags
- Affected elements with HTML snippets
- Links to detailed documentation

### Lighthouse CI Reports

Lighthouse reports are saved to `frontend/.lighthouseci/`:

```
frontend/.lighthouseci/
├── manifest.json
├── lhr-*.json           # Lighthouse results
└── lhr-*.html          # HTML reports
```

## Troubleshooting

### Common Issues

#### 1. Pre-commit Hook Not Running

**Symptom:** Commits succeed without accessibility checks

**Solution:**
```bash
cd frontend
npm run prepare
chmod +x .husky/pre-commit
```

#### 2. Development Server Not Detected

**Symptom:** "Development server not running on port 4200"

**Solution:**
```bash
# Start the dev server in another terminal
npm start

# Wait for server to be ready, then commit
git commit -m "Your message"
```

#### 3. Lighthouse CI Fails

**Symptom:** "Could not connect to Chrome"

**Solution:**
```bash
# Install Chrome/Chromium
npx playwright install chromium

# Or use system Chrome
export CHROME_PATH=/usr/bin/google-chrome
```

#### 4. False Positive Violations

**Symptom:** Legitimate violations reported incorrectly

**Solution:**
- Review the HTML report for context
- Check if ARIA attributes are properly set
- Verify color contrast with a contrast checker
- If necessary, add to allowed violations in test config

### Getting Help

1. Check the HTML reports in `a11y-reports/` for detailed violation info
2. Review WCAG guidelines at https://www.w3.org/WAI/WCAG21/quickref/
3. Consult axe-core documentation at https://github.com/dequelabs/axe-core
4. Check Lighthouse documentation at https://developers.google.com/web/tools/lighthouse

## Best Practices

### Writing Accessible Code

1. **Use Semantic HTML**
   ```html
   <!-- Good -->
   <button>Click me</button>
   
   <!-- Bad -->
   <div onclick="...">Click me</div>
   ```

2. **Add ARIA Labels**
   ```html
   <!-- Good -->
   <button aria-label="Close dialog">×</button>
   
   <!-- Bad -->
   <button>×</button>
   ```

3. **Ensure Keyboard Navigation**
   ```typescript
   // Good - focusable and keyboard accessible
   <button (click)="submit()" (keydown.enter)="submit()">
   
   // Bad - not keyboard accessible
   <div (click)="submit()">
   ```

4. **Provide Text Alternatives**
   ```html
   <!-- Good -->
   <img src="logo.png" alt="Company Logo">
   
   <!-- Bad -->
   <img src="logo.png">
   ```

5. **Use Sufficient Color Contrast**
   - Minimum 4.5:1 for normal text
   - Minimum 3:1 for large text (18pt+)
   - Use tools like https://webaim.org/resources/contrastchecker/

### Testing New Features

When implementing new features:

1. Run accessibility tests locally:
   ```bash
   npm run e2e:a11y
   ```

2. Check Lighthouse scores:
   ```bash
   npm run lighthouse:ci
   ```

3. Test with keyboard only (no mouse)

4. Test with screen reader (NVDA, JAWS, or VoiceOver)

5. Review generated reports before creating PR

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
