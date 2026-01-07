import { test, expect } from './auth.fixture';
import { DossiersListPage } from './pages/dossiers-list.page';
import { DossierDetailPage } from './pages/dossier-detail.page';

test.describe('Partie Prenante CRUD E2E Tests', () => {
  test('Full CRUD workflow: create → verify → update → verify → delete → verify', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    await dossiersPage.goto();

    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `Partie Test Lead ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    await dossierDetailPage.switchToTab('Parties prenantes');

    const ajouterButton = page.locator('button:has-text("Ajouter")');
    await ajouterButton.click();

    await page.waitForSelector('mat-dialog-container', { timeout: 5000 });

    const timestamp = new Date().getTime();
    const firstName = `Jean-${timestamp}`;
    const lastName = `Dupont-${timestamp}`;
    const phone = `+33612345${timestamp.toString().slice(-3)}`;
    const email = `jean.dupont.${timestamp}@example.com`;

    await page.locator('mat-dialog-container mat-select[formControlName="role"]').click();
    await page.locator('mat-option:has-text("Acheteur")').click();

    await page.locator('mat-dialog-container input[formControlName="firstName"]').fill(firstName);

    await page.locator('mat-dialog-container input[formControlName="lastName"]').fill(lastName);

    await page.locator('mat-dialog-container input[formControlName="phone"]').fill(phone);

    await page.locator('mat-dialog-container input[formControlName="email"]').fill(email);

    const submitButton = page.locator('mat-dialog-container button:has-text("Ajouter")');
    await submitButton.click();

    await page.waitForTimeout(2000);

    const partiesTable = page.locator('table.data-table');
    await expect(partiesTable).toBeVisible({ timeout: 10000 });

    const partyRow = partiesTable.locator('tbody tr').filter({ hasText: firstName });
    await expect(partyRow).toBeVisible({ timeout: 10000 });

    await expect(partyRow.locator('td').filter({ hasText: 'Acheteur' })).toBeVisible();
    await expect(partyRow.locator('td').filter({ hasText: firstName })).toBeVisible();
    await expect(partyRow.locator('td').filter({ hasText: lastName })).toBeVisible();
    await expect(partyRow.locator('td').filter({ hasText: phone })).toBeVisible();
    await expect(partyRow.locator('td').filter({ hasText: email })).toBeVisible();

    const editButton = partyRow.locator('button:has-text("Éditer")');
    await editButton.click();

    await page.waitForSelector('mat-dialog-container', { timeout: 5000 });

    const newPhone = `+33698765${timestamp.toString().slice(-3)}`;
    const newEmail = `jean.updated.${timestamp}@example.com`;

    const phoneInput = page.locator('mat-dialog-container input[formControlName="phone"]');
    await phoneInput.clear();
    await phoneInput.fill(newPhone);

    const emailInput = page.locator('mat-dialog-container input[formControlName="email"]');
    await emailInput.clear();
    await emailInput.fill(newEmail);

    const saveButton = page.locator('mat-dialog-container button:has-text("Modifier")');
    await saveButton.click();

    await page.waitForTimeout(2000);

    const updatedRow = partiesTable.locator('tbody tr').filter({ hasText: firstName });
    await expect(updatedRow).toBeVisible({ timeout: 10000 });
    await expect(updatedRow.locator('td').filter({ hasText: newPhone })).toBeVisible();
    await expect(updatedRow.locator('td').filter({ hasText: newEmail })).toBeVisible();

    const deleteButton = updatedRow.locator('button:has-text("Supprimer")');
    await deleteButton.click();

    await page.waitForSelector('mat-dialog-container', { timeout: 5000 });

    const confirmButton = page.locator('mat-dialog-container button:has-text("Supprimer")');
    await confirmButton.click();

    await page.waitForTimeout(2000);

    const deletedRow = partiesTable.locator('tbody tr').filter({ hasText: firstName });
    await expect(deletedRow).toHaveCount(0, { timeout: 10000 });

    const emailCell = partiesTable.locator('tbody td').filter({ hasText: newEmail });
    await expect(emailCell).toHaveCount(0);
  });

  test('Email validation test', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    await dossiersPage.goto();

    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `Email Validation Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    await dossierDetailPage.switchToTab('Parties prenantes');

    const ajouterButton = page.locator('button:has-text("Ajouter")');
    await ajouterButton.click();

    await page.waitForSelector('mat-dialog-container', { timeout: 5000 });

    const timestamp = new Date().getTime();
    
    await page.locator('mat-dialog-container mat-select[formControlName="role"]').click();
    await page.locator('mat-option:has-text("Acheteur")').click();
    
    await page.locator('mat-dialog-container input[formControlName="firstName"]').fill('Test');
    await page.locator('mat-dialog-container input[formControlName="lastName"]').fill('User');
    await page.locator('mat-dialog-container input[formControlName="phone"]').fill('+33612345678');
    
    const emailInput = page.locator('mat-dialog-container input[formControlName="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    const errorMessage = page.locator('mat-dialog-container mat-error');
    await expect(errorMessage.filter({ hasText: /email|invalide/i })).toBeVisible({ timeout: 3000 });

    const submitButton = page.locator('mat-dialog-container button:has-text("Ajouter")');
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    expect(isDisabled).toBeTruthy();

    const cancelButton = page.locator('mat-dialog-container button:has-text("Annuler")');
    await cancelButton.click();
  });

  test('Phone format validation with +33 format', async ({ page }) => {
    const dossiersPage = new DossiersListPage(page);
    const dossierDetailPage = new DossierDetailPage(page);

    await dossiersPage.goto();

    const hasDossiers = await dossiersPage.hasDossiers();
    if (!hasDossiers) {
      const timestamp = new Date().getTime();
      await dossiersPage.createDossier(
        `Phone Validation Test ${timestamp}`,
        `+3361234${timestamp.toString().slice(-4)}`
      );
    } else {
      await dossiersPage.openFirstDossier();
    }

    await dossierDetailPage.switchToTab('Parties prenantes');

    const ajouterButton = page.locator('button:has-text("Ajouter")');
    await ajouterButton.click();

    await page.waitForSelector('mat-dialog-container', { timeout: 5000 });

    const timestamp = new Date().getTime();
    
    await page.locator('mat-dialog-container mat-select[formControlName="role"]').click();
    await page.locator('mat-option:has-text("Acheteur")').click();
    
    await page.locator('mat-dialog-container input[formControlName="firstName"]').fill('Test');
    await page.locator('mat-dialog-container input[formControlName="lastName"]').fill('User');
    await page.locator('mat-dialog-container input[formControlName="email"]').fill(`test.${timestamp}@example.com`);
    
    const phoneInput = page.locator('mat-dialog-container input[formControlName="phone"]');
    await phoneInput.fill(`+33612345${timestamp.toString().slice(-3)}`);
    await phoneInput.blur();

    const phoneError = page.locator('mat-dialog-container mat-error').filter({ hasText: /téléphone|phone/i });
    await expect(phoneError).toHaveCount(0);

    const submitButton = page.locator('mat-dialog-container button:has-text("Ajouter")');
    const isEnabled = await submitButton.isEnabled();
    expect(isEnabled).toBeTruthy();

    const cancelButton = page.locator('mat-dialog-container button:has-text("Annuler")');
    await cancelButton.click();
  });
});
