import { test, expect } from '../fixtures/test.js';
test('parallel HTTP requests stay within the budget in the single-process mock', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create({ budgetCents: 500, costPerImpressionCents: 100 });
  const ids = Array.from({ length: 12 }, (_, index) => eventFactory.next(`parallel-${index}`));

  for (const id of ids) await api.acceptImpression(campaign.id, id);
  // This verifies the API's current single-process behavior. It is not a distributed
  // race-condition test: the service mutates in-memory state synchronously.
  const results = await Promise.all(ids.map(id => api.processImpression(campaign.id, id)));
  expect(results.every(response => response.status() === 200)).toBe(true);

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.totalCents).toBeLessThanOrEqual(campaign.budgetCents);
  expect(ledger.entries).toHaveLength(5);
});

test('parallel duplicate retries create one financial entry', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.acceptImpression(campaign.id, 'parallel-duplicate');

  const results = await Promise.all(
    Array.from({ length: 10 }, () => api.processImpression(campaign.id, 'parallel-duplicate'))
  );
  expect(results.every(response => response.status() === 200)).toBe(true);

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.entries).toHaveLength(1);
  expect(ledger.totalCents).toBe(100);
});
