import { test, expect } from '@playwright/test';
import { existsSync, statSync } from 'node:fs';

const statePath = '.auth/dcm-state.json';

test('authenticated browser state is available', async () => {
  expect(
    existsSync(statePath),
    `Missing ${statePath}. Run "npm run auth:setup", sign in manually, complete MFA, and save the session.`
  ).toBeTruthy();

  expect(statSync(statePath).size, 'The saved browser state file is empty').toBeGreaterThan(0);
});
