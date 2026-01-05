import { test, expect } from './auth.fixture';

test.describe('Dossier Message E2E Tests', () => {
  test('Scenario 1: Login → Navigate to dossiers list → Open dossier detail → Add message in Messages tab → Verify message appears in timeline', async ({ page }) => {
    // Step 1: Already authenticated via fixture
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Navigate to dossiers list
    const dossiersLink = page.locator('a[href="/dossiers"], button:has-text("Dossiers")');
    await dossiersLink.first().click();
    await page.waitForURL(/.*dossiers/, { timeout: 10000 });

    // Wait for dossiers to load
    await page.waitForSelector('table.data-table, .dossier-card, .empty-message', { timeout: 15000 });

    // Step 3: Open the first dossier detail
    // Try to find a dossier link or row
    const dossierLink = page.locator('table.data-table tbody tr').first();
    const hasDossiers = await dossierLink.count() > 0;

    if (!hasDossiers) {
      // If no dossiers exist, create one first
      const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouveau")');
      await createButton.first().click();
      
      // Fill in required fields for dossier creation
      await page.locator('input#leadName, input[name="leadName"]').fill('Test Lead E2E');
      await page.locator('input#leadPhone, input[name="leadPhone"]').fill('+33612345678');
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Créer")');
      await submitButton.click();
      
      // Wait for redirect to dossier detail or list
      await page.waitForTimeout(2000);
    } else {
      // Click on the first dossier
      await dossierLink.click();
    }

    // Wait for dossier detail page to load
    await page.waitForURL(/.*dossiers\/\d+/, { timeout: 10000 });

    // Step 4: Navigate to Messages tab
    const messagesTab = page.locator('div.mat-mdc-tab-label-content:has-text("Messages"), .mat-tab-label:has-text("Messages")');
    await messagesTab.click();

    // Wait for messages tab to be active
    await page.waitForTimeout(1000);

    // Step 5: Add a new message
    const addMessageButton = page.locator('button:has-text("Nouveau message")');
    await addMessageButton.click();

    // Wait for message dialog to open
    await page.waitForSelector('mat-dialog-container, .dialog-container', { timeout: 5000 });

    // Generate unique content for the test message
    const messageContent = `Test E2E Message - ${new Date().toISOString()}`;
    const timestamp = new Date().toISOString();

    // Fill in message form
    await page.locator('select#channel, select[name="channel"]').selectOption('EMAIL');
    await page.locator('select#direction, select[name="direction"]').selectOption('INBOUND');
    await page.locator('textarea#content, textarea[name="content"]').fill(messageContent);
    await page.locator('input[type="datetime-local"]').fill(timestamp.substring(0, 16));

    // Submit message form
    const submitMessageButton = page.locator('mat-dialog-container button:has-text("Créer"), mat-dialog-container button:has-text("Enregistrer")');
    await submitMessageButton.click();

    // Wait for dialog to close and message to be created
    await page.waitForTimeout(2000);

    // Step 6: Verify message appears in timeline
    const messageCard = page.locator('.message-card, .timeline-item').filter({ hasText: messageContent });
    await expect(messageCard).toBeVisible({ timeout: 10000 });

    // Verify message details
    const messageTimestamp = messageCard.locator('.message-timestamp, .timestamp');
    await expect(messageTimestamp).toBeVisible();

    // Verify channel badge
    const channelBadge = messageCard.locator('.channel-badge, .badge:has-text("EMAIL")');
    await expect(channelBadge).toBeVisible();

    // Verify direction badge
    const directionBadge = messageCard.locator('.direction-badge, .badge:has-text("Entrant")');
    await expect(directionBadge).toBeVisible();

    // Verify message content
    const messageContentElement = messageCard.locator('.message-content, .content');
    await expect(messageContentElement).toContainText(messageContent);
  });
});
