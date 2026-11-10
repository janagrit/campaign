
import 'dotenv/config';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function main() {
  const baseURL =
    process.env.BASE_URL ?? 'https://dcm.disneyadvertising.com';

  const email = process.env.DCM_EMAIL;
  const password = process.env.DCM_PASSWORD;

  if (!email || !password) {
    throw new Error('DCM_EMAIL and DCM_PASSWORD must be set in .env');
  }

  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Opening ${baseURL}`);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

    // Fill Disney Campaign Manager login form
    await page.getByTestId('fieldEmail').fill(email);
    await page.getByTestId('fieldPassword').fill(password);

    await page.getByRole('button', { name: 'Continue' }).click();

    // Complete email verification or MFA manually
    const terminal = createInterface({ input: stdin, output: stdout });

    try {
      await terminal.question(
        '\nComplete verification/MFA and wait until the authenticated application loads. Press Enter here when ready.\n'
      );
    } finally {
      terminal.close();
    }

    await mkdir('.auth', { recursive: true });

    await context.storageState({
      path: '.auth/dcm-state.json',
    });

    console.log('Authentication session saved successfully.');

    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Authentication setup failed:', error);
  process.exitCode = 1;
});
