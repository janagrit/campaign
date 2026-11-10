import { test, expect } from '../fixtures/test.js';
test('charges a successfully delivered impression exactly once', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.acceptImpression(campaign.id, 'bill-once');
  const result = await api.processImpression(campaign.id, 'bill-once');
  expect((await result.json()).billedCents).toBe(100);

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.entries).toHaveLength(1);
  expect(ledger.totalCents).toBe(100);
});

test('reprocessing a completed event does not create another ledger entry', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.acceptImpression(campaign.id, 'process-retry');
  await api.processImpression(campaign.id, 'process-retry');
  await api.processImpression(campaign.id, 'process-retry');

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.entries).toHaveLength(1);
});

test('repeated event submission returns the existing event', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const first = await api.acceptImpression(campaign.id, 'same-event');
  const retry = await api.acceptImpression(campaign.id, 'same-event');

  expect(first.status()).toBe(202);
  expect(retry.status()).toBe(200);
  expect((await retry.json()).duplicate).toBe(true);
});

test('budget cap allows exact spend but rejects the next event', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create({ budgetCents: 200, costPerImpressionCents: 100 });
  for (const id of ['budget-a', 'budget-b']) {
    await api.acceptImpression(campaign.id, id);
    expect((await api.processImpression(campaign.id, id)).status()).toBe(200);
  }

  await api.acceptImpression(campaign.id, 'budget-c');
  const third = await api.processImpression(campaign.id, 'budget-c');
  expect((await third.json()).rejectionReason).toBe('BUDGET_EXCEEDED');

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.totalCents).toBe(200);
});

test('rejected events do not appear as billable impressions', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create({ budgetCents: 100, costPerImpressionCents: 100 });
  await api.acceptImpression(campaign.id, 'first');
  await api.processImpression(campaign.id, 'first');
  await api.acceptImpression(campaign.id, 'second');
  await api.processImpression(campaign.id, 'second');

  const report = await (await api.report(campaign.id)).json();
  expect(report.impressions).toBe(1);
  expect(report.spendCents).toBe(100);
});

test('campaigns are financially isolated from one another', async ({ request, api, campaignFactory, eventFactory }) => {
  const first = await campaignFactory.create({ budgetCents: 100, costPerImpressionCents: 100 });
  const second = await campaignFactory.create({ budgetCents: 500, costPerImpressionCents: 100 });

  await api.acceptImpression(first.id, 'first-campaign-event');
  await api.processImpression(first.id, 'first-campaign-event');
  await api.acceptImpression(second.id, 'second-campaign-event');
  await api.processImpression(second.id, 'second-campaign-event');

  const firstLedger = await (await api.ledger(first.id)).json();
  const secondLedger = await (await api.ledger(second.id)).json();
  expect(firstLedger.totalCents).toBe(100);
  expect(secondLedger.totalCents).toBe(100);
});

test('unknown events cannot be processed or billed', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const response = await api.processImpression(campaign.id, 'missing-event');
  expect(response.status()).toBe(404);
});
