import { test, expect } from '@playwright/test';

// Read-only UI regression checks derived from the authenticated exploratory audit.
// Run with a manually-created local storage state; no account data is modified.

test.describe('Campaign Manager accessibility and UI consistency', () => {
  test('DCM-003: Campaigns search accessible name should match its visible purpose', async ({ page }) => {
    await page.goto('/campaigns');
    const search = page.getByRole('textbox', { name: 'Search Campaigns' });
    await expect(search).toBeVisible();
    // The exploratory audit recorded the conflicting accessible name "Search Brands".
  });

  test('DCM-006: no unread indicator should be shown when notifications are empty', async ({ page }) => {
    await page.goto('/campaigns');
    const bell = page.getByRole('button', { name: 'Notifications: no new notifications' });
    await expect(bell).toBeVisible();
    // The visual indicator itself requires a stable DOM locator to assert independently.
    await bell.click();
    await expect(page.getByText('You currently have no in-platform notifications.')).toBeVisible();
  });

  test('DCM-010: Profile edit controls should have distinct accessible names', async ({ page }) => {
    await page.goto('/account/profile');
    await expect(page.getByRole('button', { name: /edit account information/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /edit contact information/i })).toBeVisible();
  });

  test('DCM-014: account switcher search should have an accessible name', async ({ page }) => {
    await page.goto('/org-switcher');
    await expect(page.getByRole('textbox', { name: /search accounts/i })).toBeVisible();
  });
});
