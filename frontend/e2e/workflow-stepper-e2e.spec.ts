import { test, expect } from './auth.fixture';
import {
  navigateToDossiers,
  closeSnackbar
} from './helpers';

test.describe('Workflow Stepper E2E Tests - Dossier Status Progression', () => {
  test('Complete workflow progression: NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON with stepper validation', async ({ page }) => {
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const leadName = `Test Workflow Stepper ${timestamp}`;
    const leadPhone = `+336${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const url = page.url();
    const dossierId = url.match(/dossiers\/(\d+)/)?.[1];
    expect(dossierId).toBeTruthy();

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');
    
    await verifyWorkflowState(page, workflowStepper, {
      status: 'NEW',
      progressPercent: 0,
      statusBadgeText: 'Nouveau',
      hint: 'Complétez les informations du prospect et démarrez la qualification.',
      completedSteps: [],
      activeStepIndex: 0,
      isClosed: false
    });

    await transitionToStatus(page, 'QUALIFYING');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'QUALIFYING',
      progressPercent: 25,
      statusBadgeText: 'Qualification',
      hint: 'Validez le besoin, le budget et les critères. Ajoutez une note de synthèse.',
      completedSteps: [0],
      activeStepIndex: 1,
      isClosed: false
    });

    await transitionToStatus(page, 'QUALIFIED');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'QUALIFIED',
      progressPercent: 50,
      statusBadgeText: 'Qualifié',
      hint: 'Planifiez un rendez-vous et associez une annonce si besoin.',
      completedSteps: [0, 1],
      activeStepIndex: 2,
      isClosed: false
    });

    await transitionToStatus(page, 'APPOINTMENT');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'APPOINTMENT',
      progressPercent: 75,
      statusBadgeText: 'Rendez-vous',
      hint: 'Après le rendez-vous, consignez le compte-rendu et clôturez le dossier.',
      completedSteps: [0, 1, 2],
      activeStepIndex: 3,
      isClosed: false
    });

    await transitionToStatus(page, 'WON');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'WON',
      progressPercent: 100,
      statusBadgeText: 'Gagné',
      hint: 'Dossier gagné : préparez les documents et passez en phase contractualisation.',
      completedSteps: [0, 1, 2, 3],
      activeStepIndex: 4,
      isClosed: true,
      closeLabel: 'Gagné',
      closeIcon: 'check_circle'
    });

    await verifyStepIcons(workflowStepper, ['fiber_new', 'manage_search', 'verified', 'event', 'emoji_events']);
    await verifyStepLabels(workflowStepper, ['Nouveau', 'Qualification', 'Qualifié', 'Rendez-vous', 'Clôture (Gagné)']);

    await verifyStatusIsTerminal(page, 'WON');
  });

  test('Workflow progression to LOST terminal state: NEW → QUALIFYING → LOST', async ({ page }) => {
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const leadName = `Test Workflow Lost ${timestamp}`;
    const leadPhone = `+337${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'NEW',
      progressPercent: 0,
      statusBadgeText: 'Nouveau',
      completedSteps: [],
      activeStepIndex: 0,
      isClosed: false
    });

    await transitionToStatus(page, 'QUALIFYING');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'QUALIFYING',
      progressPercent: 25,
      completedSteps: [0],
      activeStepIndex: 1,
      isClosed: false
    });

    await transitionToStatus(page, 'LOST');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'LOST',
      progressPercent: 100,
      statusBadgeText: 'Perdu',
      hint: 'Dossier perdu : indiquez la raison et gardez une trace pour l\'analyse.',
      completedSteps: [0, 1, 2, 3],
      activeStepIndex: 4,
      isClosed: true,
      closeLabel: 'Perdu',
      closeIcon: 'cancel'
    });

    await verifyStepIcons(workflowStepper, ['fiber_new', 'manage_search', 'verified', 'event', 'cancel']);
    await verifyStepLabels(workflowStepper, ['Nouveau', 'Qualification', 'Qualifié', 'Rendez-vous', 'Clôture (Perdu)']);

    await verifyStatusIsTerminal(page, 'LOST');
  });

  test('Direct transition to LOST from NEW', async ({ page }) => {
    await navigateToDossiers(page);

    const timestamp = new Date().getTime();
    const leadName = `Test Direct Lost ${timestamp}`;
    const leadPhone = `+338${timestamp.toString().slice(-8)}`;

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      await createButton.first().click();

      await page.locator('input#leadName, input[name="leadName"]').fill(leadName);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(leadPhone);

      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();

      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      const firstDossier = page.locator('table.data-table tbody tr').first();
      await firstDossier.click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'NEW',
      progressPercent: 0,
      completedSteps: [],
      activeStepIndex: 0,
      isClosed: false
    });

    await transitionToStatus(page, 'LOST');

    await verifyWorkflowState(page, workflowStepper, {
      status: 'LOST',
      progressPercent: 100,
      statusBadgeText: 'Perdu',
      completedSteps: [0, 1, 2, 3],
      activeStepIndex: 4,
      isClosed: true,
      closeLabel: 'Perdu'
    });

    await verifyStatusIsTerminal(page, 'LOST');
  });

  test('Verify workflow stepper visual elements and accessibility', async ({ page }) => {
    await navigateToDossiers(page);

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      const timestamp = new Date().getTime();
      await createButton.first().click();
      await page.locator('input#leadName, input[name="leadName"]').fill(`Test Visual ${timestamp}`);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(`+339${timestamp.toString().slice(-8)}`);
      await page.locator('button[type="submit"], button:has-text("Créer")').click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      await page.locator('table.data-table tbody tr').first().click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');

    const workflowContainer = workflowStepper.locator('[role="group"]');
    await expect(workflowContainer).toHaveAttribute('aria-label', 'Progression du dossier');

    const workflowTitle = workflowStepper.locator('.workflow-title');
    await expect(workflowTitle).toContainText('Pipeline dossier');

    const workflowTrack = workflowStepper.locator('.workflow-track');
    await expect(workflowTrack).toBeVisible();

    const progressBar = workflowStepper.locator('.workflow-bar');
    await expect(progressBar).toBeVisible();

    const stepsList = workflowStepper.locator('ol.workflow-steps');
    await expect(stepsList).toBeVisible();

    const steps = workflowStepper.locator('.workflow-step');
    await expect(steps).toHaveCount(5);

    const hintSection = workflowStepper.locator('.workflow-hint');
    await expect(hintSection).toBeVisible();

    const hintIcon = hintSection.locator('mat-icon');
    await expect(hintIcon).toContainText('tips_and_updates');

    const allIcons = workflowStepper.locator('mat-icon');
    const iconCount = await allIcons.count();
    for (let i = 0; i < iconCount; i++) {
      const icon = allIcons.nth(i);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('Verify progress bar width updates dynamically', async ({ page }) => {
    await navigateToDossiers(page);

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      const timestamp = new Date().getTime();
      await createButton.first().click();
      await page.locator('input#leadName, input[name="leadName"]').fill(`Test Progress ${timestamp}`);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(`+330${timestamp.toString().slice(-8)}`);
      await page.locator('button[type="submit"], button:has-text("Créer")').click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      await page.locator('table.data-table tbody tr').first().click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');
    const progressBar = workflowStepper.locator('.workflow-bar');

    await expect(progressBar).toHaveCSS('width', '0%');

    await transitionToStatus(page, 'QUALIFYING');
    await page.waitForTimeout(500);
    const width1 = await progressBar.evaluate(el => el.style.width);
    expect(width1).toBe('25%');

    await transitionToStatus(page, 'QUALIFIED');
    await page.waitForTimeout(500);
    const width2 = await progressBar.evaluate(el => el.style.width);
    expect(width2).toBe('50%');

    await transitionToStatus(page, 'APPOINTMENT');
    await page.waitForTimeout(500);
    const width3 = await progressBar.evaluate(el => el.style.width);
    expect(width3).toBe('75%');

    await transitionToStatus(page, 'WON');
    await page.waitForTimeout(500);
    const width4 = await progressBar.evaluate(el => el.style.width);
    expect(width4).toBe('100%');
  });

  test('Verify closed status chip display for WON and LOST', async ({ page }) => {
    await navigateToDossiers(page);

    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
    const canCreate = await createButton.first().isVisible().catch(() => false);

    if (canCreate) {
      const timestamp = new Date().getTime();
      await createButton.first().click();
      await page.locator('input#leadName, input[name="leadName"]').fill(`Test Chip ${timestamp}`);
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill(`+331${timestamp.toString().slice(-8)}`);
      await page.locator('button[type="submit"], button:has-text("Créer")').click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 30000 });
      await closeSnackbar(page);
    } else {
      await page.locator('table.data-table tbody tr').first().click();
      await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });
    }

    const workflowStepper = page.locator('app-workflow-stepper, .workflow');

    let chip = workflowStepper.locator('.workflow-chip');
    await expect(chip).not.toBeVisible();

    await transitionToStatus(page, 'QUALIFYING');
    chip = workflowStepper.locator('.workflow-chip');
    await expect(chip).not.toBeVisible();

    await transitionToStatus(page, 'WON');
    await page.waitForTimeout(500);

    chip = workflowStepper.locator('.workflow-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toHaveClass(/won/);
    await expect(chip).toContainText('Gagné');

    const wonIcon = chip.locator('mat-icon');
    await expect(wonIcon).toContainText('check_circle');
  });
});

async function transitionToStatus(page: any, status: string): Promise<void> {
  const changeStatusButton = page.locator('button:has-text("Changer statut")');
  await changeStatusButton.click();

  await page.waitForSelector('select#status-select', { timeout: 5000 });

  const statusSelect = page.locator('select#status-select');
  await statusSelect.selectOption(status);

  const updateButton = page.locator('button:has-text("Mettre à jour le statut")');
  await updateButton.click();

  const successSnackbar = page.locator('.mat-mdc-snack-bar-container:has-text("Statut mis à jour avec succès")');
  await expect(successSnackbar).toBeVisible({ timeout: 10000 });
  await closeSnackbar(page);

  await page.waitForTimeout(1000);
}

interface WorkflowStateExpectation {
  status: string;
  progressPercent: number;
  statusBadgeText?: string;
  hint?: string;
  completedSteps: number[];
  activeStepIndex: number;
  isClosed: boolean;
  closeLabel?: string;
  closeIcon?: string;
}

async function verifyWorkflowState(
  page: any,
  workflowStepper: any,
  expected: WorkflowStateExpectation
): Promise<void> {
  const statusBadge = page.locator('app-badge-status');
  if (expected.statusBadgeText) {
    const badgeText = await statusBadge.textContent();
    expect(badgeText?.trim()).toBe(expected.statusBadgeText);
  }

  const progressText = workflowStepper.locator('.workflow-progress');
  await expect(progressText).toContainText(`${expected.progressPercent}%`);

  if (expected.hint) {
    const hintSection = workflowStepper.locator('.workflow-hint');
    await expect(hintSection).toContainText(expected.hint);
  }

  const steps = workflowStepper.locator('.workflow-step');

  for (const completedIndex of expected.completedSteps) {
    const step = steps.nth(completedIndex);
    await expect(step).toHaveClass(/completed/);
  }

  const activeStep = steps.nth(expected.activeStepIndex);
  await expect(activeStep).toHaveClass(/active/);

  if (expected.isClosed) {
    const chip = workflowStepper.locator('.workflow-chip');
    await expect(chip).toBeVisible();

    if (expected.closeLabel) {
      await expect(chip).toContainText(expected.closeLabel);
    }

    if (expected.closeIcon) {
      const chipIcon = chip.locator('mat-icon');
      await expect(chipIcon).toContainText(expected.closeIcon);
    }
  } else {
    const chip = workflowStepper.locator('.workflow-chip');
    const isVisible = await chip.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  }
}

async function verifyStepIcons(workflowStepper: any, expectedIcons: string[]): Promise<void> {
  const steps = workflowStepper.locator('.workflow-step');
  
  for (let i = 0; i < expectedIcons.length; i++) {
    const step = steps.nth(i);
    const icon = step.locator('.step-dot mat-icon');
    await expect(icon).toContainText(expectedIcons[i]);
  }
}

async function verifyStepLabels(workflowStepper: any, expectedLabels: string[]): Promise<void> {
  const stepLabels = workflowStepper.locator('.step-label');
  
  for (let i = 0; i < expectedLabels.length; i++) {
    const label = stepLabels.nth(i);
    await expect(label).toHaveText(expectedLabels[i]);
  }
}

async function verifyStatusIsTerminal(page: any, status: string): Promise<void> {
  const changeStatusButton = page.locator('button:has-text("Changer statut")');
  await changeStatusButton.click();

  await page.waitForSelector('select#status-select', { timeout: 5000 });

  const statusSelect = page.locator('select#status-select');
  const isDisabled = await statusSelect.isDisabled();

  if (!isDisabled) {
    const options = statusSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBe(1);

    const firstOptionValue = await options.first().getAttribute('value');
    expect(firstOptionValue).toBe(status);
  } else {
    expect(isDisabled).toBeTruthy();
  }

  const cancelButton = page.locator('button:has-text("Annuler")');
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  }
}
