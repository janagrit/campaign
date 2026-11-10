import { test, expect } from '../fixtures/test.js';
test('event accepted before stop confirmation is billable after confirmation', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const accepted = await api.acceptImpression(campaign.id, 'before-confirmation');
  const acceptedEvent = await accepted.json();
  await api.pause(campaign.id);
  const confirmed = await api.confirmStop(campaign.id);
  const stoppedCampaign = await confirmed.json();
  expect(acceptedEvent.acceptedSequence).toBeLessThan(stoppedCampaign.stoppedSequence);

  const processed = await api.processImpression(campaign.id, 'before-confirmation');
  expect((await processed.json()).status).toBe('DELIVERED');
});

test('event submitted after stop confirmation is rejected and never enters ledger', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.pause(campaign.id);
  await api.confirmStop(campaign.id);

  const accepted = await api.acceptImpression(campaign.id, 'after-confirmation');
  expect(accepted.status()).toBe(409);

  const ledger = await (await api.ledger(campaign.id)).json();
  expect(ledger.entries).toHaveLength(0);
});

test('stop confirmation cannot be applied without a pending stop request', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const response = await api.confirmStop(campaign.id);
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toBe('STOP_NOT_PENDING');
});
