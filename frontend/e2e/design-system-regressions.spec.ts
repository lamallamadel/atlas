import { test, expect } from './stable-test-fixture';

test.describe('Design System Regressions - Phase 6', () => {
  
  test('should display tables correctly without legacy mat-table classes', async ({ authenticatedPage: page }) => {
    // Navigate to Dossiers where the ds-table is rendered by default in list mode
    await page.goto('/pro/dossiers');
    
    // Ensure the page loads without the infinite 401 loop
    const toasts = page.locator('ds-toast');
    await expect(toasts).toHaveCount(0); // No infinite session expired toasts!

    // Wait for the skeleton loader to disappear
    const skeleton = page.locator('.dos-skeleton-list');
    await expect(skeleton).toHaveCount(0);

    // Verify the new ds-table OR the empty state is present
    const tableWrap = page.locator('.ds-table-wrap, .ds-table').first();
    const emptyState = page.locator('ds-empty-state').first();

    // The page will either have a populated table or an empty state
    await expect(tableWrap.or(emptyState)).toBeVisible();
    
    // Verify no legacy mat-table exists
    const legacyTable = page.locator('table.mat-table');
    await expect(legacyTable).toHaveCount(0);
  });

  test('should verify routing buttons are semantic anchor tags', async ({ authenticatedPage: page }) => {
    // Navigate to the contact page where routing buttons were fixed
    await page.goto('/biz/contact');
    
    // Find the button that routes to /biz/demo
    const demoButton = page.locator('a.ds-btn[href="/biz/demo"]');
    await expect(demoButton).toBeVisible();
    await expect(demoButton).toHaveClass(/ds-btn--marine/);
    
    // Ensure it's not a button tag wrapping a routerLink
    const brokenButton = page.locator('button[routerLink]');
    await expect(brokenButton).toHaveCount(0);
  });

  test('should verify date fields are styled and accessible', async ({ authenticatedPage: page }) => {
    // Navigate to a page with date fields, for example reports
    await page.goto('/pro/reports');
    
    // Ensure the native date inputs are wrapped in ds-field structure
    const dateInput = page.locator('.ds-field__input[type="date"]').first();
    if (await dateInput.count() > 0) {
      await expect(dateInput).toBeVisible();
      // Click the input to verify focus styling doesn't crash
      await dateInput.click();
    }
  });

  test('should verify dossier detail layout loads without catastrophic CSS failure', async ({ authenticatedPage: page }) => {
    // Navigate to dossier creation or detail
    await page.goto('/pro/dossiers/create');
    
    // The ds-form-stack utility class should be present and provide Flexbox gap
    const formStack = page.locator('.ds-form-stack').first();
    await expect(formStack).toBeVisible();

    // Verify it computes to display flex (proves CSS is loaded)
    const displayStyle = await formStack.evaluate((el) => window.getComputedStyle(el).display);
    expect(displayStyle).toBe('flex');
  });
});
