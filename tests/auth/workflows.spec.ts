import { test, expect } from '@playwright/test';

// Read-only UI regression checks derived from the authenticated exploratory audit.
// These checks do not submit forms or modify campaign/account data.

test.describe('Campaign Manager workflows and loading states', () => {
  test('DCM-005: Payment Methods must not show a resolved empty state while loading', async ({ page }) => {
    await page.goto('/account/paymentMethods');
    const spinner = page.getByRole('progressbar');
    const emptyState = page.getByText('No Payment Methods Available');
    // Fail when the empty state and loading indicator are visible at the same time.
    if (await spinner.isVisible() && await emptyState.isVisible()) {
      throw new Error('Observed contradictory state: payment-method empty state and loading indicator are both visible.');
    }
  });

  test('DCM-007: on-demand report should not expose active schedule frequency controls', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('button', { name: /create new report/i }).click();
    await page.getByLabel(/delivery/i).selectOption({ label: 'Prepare for download' });
    const daily = page.getByRole('radio', { name: 'Daily' });
    await expect(daily).toBeHidden();
  });

  test('DCM-009: empty billing lists should not expose pagination controls', async ({ page }) => {
    await page.goto('/account/billing');
    await expect(page.getByText(/no billing information available/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /next page/i })).toBeHidden();
  });

  test('DCM-013: campaign empty state should settle without stale table controls', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page.getByText('Create your first campaign!')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /campaign name/i })).toBeHidden();
  });
});
