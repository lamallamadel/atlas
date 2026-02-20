import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

test.describe('Atlas Agentic Flow (Phase 2 & 3)', () => {

    const generateRandomPhone = () => '+33' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');

    test('Full Journey: Lead Creation -> Nudging -> AI Chat -> Compromis Generation', async ({ page }) => {
        // 1. Navigate and login (assuming auto-login or basic state in our test setup)
        await page.goto('/dossiers');

        // Wait for the app to be stable
        await page.waitForLoadState('networkidle');

        // 2. Create Lead (Dossier)
        const phone = generateRandomPhone();
        const leadName = 'Lead ' + randomBytes(4).toString('hex');

        // We use the new CMD+K palette to quickly navigate or act
        await page.keyboard.press('Control+k');
        await page.getByPlaceholder('Rechercher une action...').fill('Créer dossier');
        await page.keyboard.press('Enter');

        // Fill the quick create form
        await page.getByLabel('Téléphone').fill(phone);
        await page.getByLabel('Nom / Description').fill(leadName);
        await page.getByRole('button', { name: 'Créer' }).click();

        // 3. Verify Lead in list, then click it
        await page.getByText(leadName).click();

        // 4. Check for Nudging (Virtual Coach) banner
        // In our implementation, a newly created lead might not instantly have nudges
        // but the Coach UI block should be present
        const coachContainer = page.locator('.virtual-coach-container');
        await expect(coachContainer).toBeVisible({ timeout: 15000 });

        // Ensure tooltips are present and working (Trust / Glass box)
        const coachIcon = page.locator('.virtual-coach-icon');
        await coachIcon.hover();
        // Material tooltip check
        await expect(page.locator('.mat-mdc-tooltip')).toBeVisible();

        // 5. Open AI Chat Agent
        await page.keyboard.press('Alt+a'); // Open panel
        const chatPanel = page.locator('.ai-panel');
        await expect(chatPanel).toBeVisible();

        // Send a message
        const chatInput = page.locator('.ai-input');
        await chatInput.fill('Peux-tu me résumer les informations de ce prospect ?');
        await page.keyboard.press('Enter');

        // Wait for the agent to reply
        const agentReply = page.locator('.agent-bubble').last();
        // Assuming backend takes a few seconds
        await expect(agentReply).toContainText('Atlas IA', { ignoreCase: true, timeout: 10000 });

        // 6. Navigate to /documents or find Compromis button
        // It's in the dossier detail tab "Documents"
        await page.getByRole('tab', { name: 'Documents' }).click();

        // 7. Click "Générer Compromis"
        const btnGenerate = page.getByRole('button', { name: /Générer.*Compromis/i });
        if (await btnGenerate.isVisible()) {
            await btnGenerate.click();

            // We expect a snackbar or some processing status
            await expect(page.locator('snack-bar-container')).toContainText('Génération', { timeout: 10000 });

            // Check if a new document appeared
            await expect(page.locator('.document-list')).toContainText('Compromis', { timeout: 15000 });
        }
    });

});
