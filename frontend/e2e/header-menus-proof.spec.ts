import { test, expect } from '@playwright/test';

test('Proof that User, Notification, and Help menus toggle correctly and independently', async ({ page }) => {
  // Go to the reports dashboard (or any page with the layout)
  await page.goto('/reports');

  // Wait for the layout to be ready
  const userBtn = page.locator('.user-menu-button');
  const helpBtn = page.locator('.help-menu-button');
  const notifBtn = page.locator('.notification-menu-button');

  // Menus panels
  const userPanel = page.locator('#user-menu-panel');
  const helpPanel = page.locator('#help-menu-panel');
  const notifPanel = page.locator('#notification-center-panel');

  // Initial state: nothing is visible
  await expect(userPanel).not.toBeVisible();
  await expect(helpPanel).not.toBeVisible();
  await expect(notifPanel).not.toBeVisible();

  // 1. Click User Menu
  await userBtn.click();
  await expect(userPanel).toBeVisible(); // User menu should be open
  await expect(helpPanel).not.toBeVisible();

  // 2. Click Help Menu (while User menu is still open)
  // This was failing before: it would click the backdrop and only close User, without opening Help.
  await helpBtn.click();
  await expect(userPanel).not.toBeVisible(); // User menu MUST be closed
  await expect(helpPanel).toBeVisible();     // Help menu MUST be open

  // 3. Click Notification Menu (while Help is open)
  await notifBtn.click();
  await expect(helpPanel).not.toBeVisible(); // Help menu MUST be closed
  await expect(notifPanel).toBeVisible();    // Notification menu MUST be open

  // 4. Click outside to close the current open menu (Notification)
  await page.mouse.click(0, 0); // Click top-left corner
  await expect(notifPanel).not.toBeVisible(); // Should be closed now

  console.log("SUCCESS: All menus open and close smoothly without alternating clicks!");
});
