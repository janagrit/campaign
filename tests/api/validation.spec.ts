import { test, expect } from '../fixtures/test.js';
import { invalidCampaignData } from '../fixtures/data.js';

test('rejects a missing campaign name', async ({ request, api, campaignFactory, eventFactory }) => {
  const response = await request.post('/api/campaigns', {
    data: { budgetCents: 1000, costPerImpressionCents: 100 }
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe('INVALID_NAME');
});

test('rejects whitespace-only and too-short names', async ({ request, api, campaignFactory, eventFactory }) => {
  for (const name of ['', '  ', 'ab']) {
    const response = await request.post('/api/campaigns', {
      data: { ...invalidCampaignData.emptyName, name }
    });
    expect(response.status()).toBe(400);
  }
});

test('rejects zero, negative, fractional and unsafe budget values', async ({ request, api, campaignFactory, eventFactory }) => {
  for (const budgetCents of [invalidCampaignData.zeroBudget.budgetCents, invalidCampaignData.negativeBudget.budgetCents, invalidCampaignData.fractionalBudget.budgetCents, Number.MAX_SAFE_INTEGER + 1]) {
    const response = await request.post('/api/campaigns', {
      data: { name: 'Valid name', budgetCents, costPerImpressionCents: 100 }
    });
    expect(response.status()).toBe(400);
  }
});

test('rejects invalid unit cost values', async ({ request, api, campaignFactory, eventFactory }) => {
  for (const costPerImpressionCents of [invalidCampaignData.zeroUnitCost.costPerImpressionCents, invalidCampaignData.negativeUnitCost.costPerImpressionCents, invalidCampaignData.fractionalUnitCost.costPerImpressionCents, '100']) {
    const response = await request.post('/api/campaigns', {
      data: { name: 'Valid name', budgetCents: 1000, costPerImpressionCents }
    });
    expect(response.status()).toBe(400);
  }
});

test('rejects empty or oversized event IDs', async ({ request, api, campaignFactory, eventFactory }) => {
  const created = await request.post('/api/campaigns', {
    data: { name: 'Valid name', budgetCents: 1000, costPerImpressionCents: 100 }
  });
  const campaign = await created.json();

  for (const eventId of ['', 'x'.repeat(151)]) {
    const response = await request.post(`/api/campaigns/${campaign.id}/impressions`, { data: { eventId } });
    expect(response.status()).toBe(400);
  }
});

test('returns a stable not-found error for an unknown campaign', async ({ request, api, campaignFactory, eventFactory }) => {
  const response = await request.get('/api/campaigns/not-a-real-id');
  expect(response.status()).toBe(404);
  expect((await response.json()).error).toBe('CAMPAIGN_NOT_FOUND');
});
