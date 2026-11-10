import { test, expect } from '@playwright/test';

test('Disney Campaign Manager public homepage responds successfully', async ({ page }) => {
  const response = await page.goto(process.env.PUBLIC_BASE_URL ?? 'https://www.disneycampaignmanager.com');
  expect(response, 'Expected the public homepage to return an HTTP response').not.toBeNull();
  expect(response!.ok(), `Unexpected homepage response: ${response!.status()}`).toBeTruthy();
});
