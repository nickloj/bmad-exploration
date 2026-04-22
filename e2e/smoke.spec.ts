import { test, expect } from '@playwright/test';

test('app loads without errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('bmad-to-do-app');
});
