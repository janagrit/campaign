import { test, expect } from '../fixtures/test.js';
test('report totals reconcile with delivered events and ledger', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  for (const eventId of ['r-1', 'r-2', 'r-3']) {
    await api.acceptImpression(campaign.id, eventId);
    await api.processImpression(campaign.id, eventId);
  }

  const report = await (await api.report(campaign.id)).json();
  expect(report).toMatchObject({
    impressions: 3,
    spendCents: 300,
    ledgerEntries: 3,
    ledgerSpendCents: 300,
    reconciled: true
  });
});

test('pending and rejected events are excluded from delivered impression count', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create({ budgetCents: 100, costPerImpressionCents: 100 });
  await api.acceptImpression(campaign.id, 'delivered');
  await api.processImpression(campaign.id, 'delivered');
  await api.acceptImpression(campaign.id, 'pending');
  await api.acceptImpression(campaign.id, 'will-reject');
  await api.processImpression(campaign.id, 'will-reject');

  const report = await (await api.report(campaign.id)).json();
  expect(report.impressions).toBe(1);
  expect(report.ledgerEntries).toBe(1);
});

test('empty campaign reports zero impressions and zero spend', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const report = await (await api.report(campaign.id)).json();
  expect(report.impressions).toBe(0);
  expect(report.spendCents).toBe(0);
  expect(report.reconciled).toBe(true);
});
