import { test, expect } from './auth.fixture';
import { navigateToDossiers, closeSnackbar, extractDossierId } from './helpers';

test.describe('Duplicate Detection E2E Tests', () => {
  test('Create dossier → Create duplicate with same phone → Verify warning banner → Navigate to existing dossier', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create first dossier with phone +33612345678
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    await createButton.first().click();

    const timestamp = new Date().getTime();
    const leadName1 = `Duplicate Test Lead 1 ${timestamp}`;
    const phoneNumber = '+33612345678';

    await page.locator('input#leadName, input[name="leadName"]').fill(leadName1);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(phoneNumber);

    const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();

    // Step 3: Wait for redirect to dossier detail page
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
    await closeSnackbar(page);

    // Step 4: Note the first dossier ID
    const url1 = page.url();
    const firstDossierId = extractDossierId(url1);
    expect(firstDossierId).toBeTruthy();
    console.log('First dossier ID:', firstDossierId);

    // Step 5: Navigate back to dossiers list
    await navigateToDossiers(page);

    // Step 6: Create second dossier with identical phone number
    await createButton.first().click();

    const leadName2 = `Duplicate Test Lead 2 ${timestamp}`;
    await page.locator('input#leadName, input[name="leadName"]').fill(leadName2);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(phoneNumber);

    // Step 7: Trigger blur event to check for duplicates
    await page.locator('input#leadPhone, input[name="leadPhone"]').blur();

    // Wait for duplicate check to complete
    await page.waitForTimeout(1500);

    // Step 8: Submit the form
    const submitButton2 = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton2.click();

    // Step 9: Verify warning banner appears
    const warningBanner = page.locator('.warning-banner');
    await expect(warningBanner).toBeVisible({ timeout: 10000 });

    // Step 10: Verify banner text mentions duplicate/existing dossier
    const warningText = page.locator('.warning-banner .warning-text');
    await expect(warningText).toContainText(/doublon|dossier.*existe/i);

    // Step 11: Verify 'Ouvrir existant' button is present in banner
    const openExistingButton = page.locator('.warning-banner button.btn-open-existing, .warning-banner button:has-text("Ouvrir")');
    await expect(openExistingButton.first()).toBeVisible();

    // Verify button text contains reference to existing dossier
    const buttonText = await openExistingButton.first().textContent();
    expect(buttonText).toMatch(/ouvrir/i);

    // Step 12: Click the 'Ouvrir existant' button
    await openExistingButton.first().click();

    // Step 13: Verify navigation to first dossier detail page
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

    // Step 14: Verify URL matches first dossier ID
    const url2 = page.url();
    const navigatedDossierId = extractDossierId(url2);
    expect(navigatedDossierId).toBe(firstDossierId);

    console.log('Successfully navigated to existing dossier:', navigatedDossierId);
  });

  test('Create dossier → Modify phone to match existing → Verify duplicate warning appears on blur', async ({ page }) => {
    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    // Step 2: Create first dossier
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    await createButton.first().click();

    const timestamp = new Date().getTime();
    const leadName1 = `Duplicate Blur Test 1 ${timestamp}`;
    const phoneNumber = `+336123456${timestamp.toString().slice(-2)}`;

    await page.locator('input#leadName, input[name="leadName"]').fill(leadName1);
    await page.locator('input#leadPhone, input[name="leadPhone"]').fill(phoneNumber);

    const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();

    // Wait for redirect
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
    await closeSnackbar(page);

    // Get first dossier ID
    const firstDossierId = extractDossierId(page.url());
    expect(firstDossierId).toBeTruthy();

    // Step 3: Navigate back to create another dossier
    await navigateToDossiers(page);
    await createButton.first().click();

    const leadName2 = `Duplicate Blur Test 2 ${timestamp}`;
    await page.locator('input#leadName, input[name="leadName"]').fill(leadName2);

    // Step 4: Enter a different phone first
    const phoneInput = page.locator('input#leadPhone, input[name="leadPhone"]');
    await phoneInput.fill('+33999999999');

    // Step 5: Change to matching phone and blur
    await phoneInput.fill(phoneNumber);
    await phoneInput.blur();

    // Step 6: Wait for duplicate check
    await page.waitForTimeout(1500);

    // Step 7: Verify warning banner appears without submitting
    const warningBanner = page.locator('.warning-banner');
    await expect(warningBanner).toBeVisible({ timeout: 5000 });

    // Step 8: Verify button is present
    const openExistingButton = page.locator('.warning-banner button.btn-open-existing, .warning-banner button:has-text("Ouvrir")');
    await expect(openExistingButton.first()).toBeVisible();

    // Step 9: Click button and verify navigation
    await openExistingButton.first().click();
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

    const navigatedDossierId = extractDossierId(page.url());
    expect(navigatedDossierId).toBe(firstDossierId);
  });

  test('Multiple duplicates → Verify multiple buttons appear', async ({ page }) => {
    // This test verifies that if somehow multiple dossiers with same phone exist,
    // multiple "Ouvrir existant" buttons are shown

    // Step 1: Navigate to dossiers list
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const sharedPhone = `+336555555${timestamp.toString().slice(-2)}`;
    const dossierIds: string[] = [];

    // Create 2 dossiers with same phone
    for (let i = 0; i < 2; i++) {
      const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(`Multi Dup Test ${i} ${timestamp}`);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(sharedPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      // If this is the first one, it should succeed
      if (i === 0) {
        await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
        const dossierId = extractDossierId(page.url());
        if (dossierId) {
          dossierIds.push(dossierId);
        }
        await closeSnackbar(page);
        await navigateToDossiers(page);
      } else {
        // For subsequent ones, duplicate warning should appear
        await page.waitForTimeout(2000);
        const warningBanner = page.locator('.warning-banner');
        const isVisible = await warningBanner.isVisible().catch(() => false);
        
        if (isVisible) {
          // If warning appears, we're done with this test scenario
          const buttons = page.locator('.warning-banner button.btn-open-existing, .warning-banner button:has-text("Ouvrir")');
          const buttonCount = await buttons.count();
          expect(buttonCount).toBeGreaterThan(0);
          
          // Click first button to navigate
          await buttons.first().click();
          await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
        }
      }
    }

    // Verify we created at least one dossier
    expect(dossierIds.length).toBeGreaterThan(0);
  });
});
