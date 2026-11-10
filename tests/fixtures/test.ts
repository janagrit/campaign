import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { CampaignApi } from '../../src/api-client.js';
import { campaignData } from './data.js';
import type { CampaignDto, CampaignFactory, EventFactory } from './types.js';

type Fixtures = {
  api: CampaignApi;
  campaignFactory: CampaignFactory;
  eventFactory: EventFactory;
  testContext: void;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => { await use(new CampaignApi(request)); },
  campaignFactory: async ({ api }, use) => {
    await use({
      async create(overrides = {}): Promise<CampaignDto> {
        const response = await api.createCampaign({ ...campaignData.standard, ...overrides });
        expect(response.status()).toBe(201);
        return response.json();
      }
    });
  },
  eventFactory: async ({}, use) => {
    await use({ next: (prefix = 'impression') => `${prefix}-${randomUUID()}` });
  },
  testContext: [async ({ request }, use) => {
    await request.delete('/__test__/reset');
    await use();
  }, { auto: true }]
});
export { expect };
