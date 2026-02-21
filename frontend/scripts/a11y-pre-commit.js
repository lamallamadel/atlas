#!/usr/bin/env node

const { chromium } = require('@playwright/test');
const axeCore = require('axe-core');
const fs = require('fs');
const path = require('path');

const CRITICAL_PAGES = [
  '/',
  '/dossiers',
  '/annonces',
];

const MAX_VIOLATIONS = {
  critical: 0,
  serious: 0,
  moderate: 5,
  minor: 10,
};

async function checkAccessibility() {
  console.log('🔍 Running pre-commit accessibility checks...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalViolations = 0;
  let criticalViolations = 0;
  let seriousViolations = 0;
  let hasBlockingIssues = false;

  const resultsDir = path.join(process.cwd(), 'a11y-reports', 'pre-commit');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    await page.addInitScript({
      path: require.resolve('axe-core'),
    });

    await page.goto('http://localhost:4200', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    const orgId = `ORG-${Date.now()}`;
    const token = buildMockToken(orgId);

    await page.evaluate(
      ({ orgId, token }) => {
        window.localStorage.setItem('org_id', orgId);
        window.localStorage.setItem('auth_mode', 'manual');
        window.localStorage.setItem('auth_token', token);
        window.localStorage.setItem('username', 'pre-commit-test');
      },
      { orgId, token }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    for (const url of CRITICAL_PAGES) {
      console.log(`\n📄 Checking ${url}...`);

      try {
        await page.goto(`http://localhost:4200${url}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        await page.waitForTimeout(1000);

        const results = await page.evaluate(async () => {
          return await axe.run(document, {
            rules: {
              'color-contrast': { enabled: true },
              'aria-required-attr': { enabled: true },
              'aria-valid-attr': { enabled: true },
              'button-name': { enabled: true },
              'image-alt': { enabled: true },
              'label': { enabled: true },
              'link-name': { enabled: true },
            },
          });
        });

        const violations = results.violations;
        const critical = violations.filter((v) => v.impact === 'critical');
        const serious = violations.filter((v) => v.impact === 'serious');
        const moderate = violations.filter((v) => v.impact === 'moderate');
        const minor = violations.filter((v) => v.impact === 'minor');

        totalViolations += violations.length;
        criticalViolations += critical.length;
        seriousViolations += serious.length;

        console.log(`  Critical: ${critical.length}`);
        console.log(`  Serious: ${serious.length}`);
        console.log(`  Moderate: ${moderate.length}`);
        console.log(`  Minor: ${minor.length}`);

        if (critical.length > MAX_VIOLATIONS.critical) {
          hasBlockingIssues = true;
          console.log(`\n  ❌ BLOCKING: ${critical.length} critical violations found!`);
          critical.forEach((v) => {
            console.log(`    - ${v.id}: ${v.description}`);
            v.nodes.slice(0, 2).forEach((node) => {
              console.log(`      Element: ${node.html.substring(0, 80)}...`);
            });
          });
        }

        if (serious.length > MAX_VIOLATIONS.serious) {
          hasBlockingIssues = true;
          console.log(`\n  ❌ BLOCKING: ${serious.length} serious violations found!`);
          serious.forEach((v) => {
            console.log(`    - ${v.id}: ${v.description}`);
          });
        }

        const fileName = url.replace(/\//g, '_') || 'root';
        fs.writeFileSync(
          path.join(resultsDir, `${fileName}.json`),
          JSON.stringify(results, null, 2)
        );
      } catch (error) {
        console.log(`  ⚠️  Warning: Could not check ${url} - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Pre-commit Accessibility Summary:');
    console.log('='.repeat(60));
    console.log(`Total violations: ${totalViolations}`);
    console.log(`Critical: ${criticalViolations} (max: ${MAX_VIOLATIONS.critical})`);
    console.log(`Serious: ${seriousViolations} (max: ${MAX_VIOLATIONS.serious})`);
    console.log('='.repeat(60));

    if (hasBlockingIssues) {
      console.log('\n❌ COMMIT BLOCKED: Critical accessibility violations detected!');
      console.log('Please fix the violations before committing.');
      console.log(`Detailed reports saved in: ${resultsDir}\n`);
      await browser.close();
      process.exit(1);
    } else if (totalViolations > 0) {
      console.log('\n⚠️  Non-blocking violations found. Consider fixing them.');
      console.log(`Detailed reports saved in: ${resultsDir}\n`);
    } else {
      console.log('\n✅ No accessibility violations found!\n');
    }

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pre-commit check failed:', error.message);
    console.log('\n⚠️  Skipping accessibility checks due to error.');
    console.log('Make sure the dev server is running: npm run start\n');
    await browser.close();
    process.exit(0);
  }
}

function buildMockToken(orgId) {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'pre-commit-test',
    preferred_username: 'pre-commit-test',
    scope: 'openid profile email',
    org_id: orgId,
    roles: ['ADMIN'],
    iat: now,
    exp: now + 60 * 60,
    iss: 'mock',
  };

  const base64UrlEncode = (obj) => {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  return `mock-${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
}

if (require.main === module) {
  checkAccessibility();
}
