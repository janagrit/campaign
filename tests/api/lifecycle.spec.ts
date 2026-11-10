import { test, expect } from '../fixtures/test.js';
test('pause is a two-phase transition: ACTIVE -> PAUSE_PENDING -> PAUSED', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const requested = await api.pause(campaign.id);
  expect(requested.status()).toBe(202);
  expect((await requested.json()).status).toBe('PAUSE_PENDING');

  const confirmed = await api.confirmStop(campaign.id);
  expect(confirmed.status()).toBe(200);
  expect((await confirmed.json()).status).toBe('PAUSED');
});

test('new impressions are accepted while pause is pending', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.pause(campaign.id);

  const accepted = await api.acceptImpression(campaign.id, 'in-flight-event');
  expect(accepted.status()).toBe(202);
  expect((await accepted.json()).status).toBe('PENDING');
});

test('an impression accepted before stop confirmation can finish in flight', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.acceptImpression(campaign.id, 'queued-before-stop');
  await api.pause(campaign.id);
  await api.confirmStop(campaign.id);

  const processed = await api.processImpression(campaign.id, 'queued-before-stop');
  expect((await processed.json()).status).toBe('DELIVERED');

  const report = await (await api.report(campaign.id)).json();
  expect(report.impressions).toBe(1);
  expect(report.spendCents).toBe(100);
});

test('a new impression is rejected after stop confirmation', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.pause(campaign.id);
  await api.confirmStop(campaign.id);

  const rejected = await api.acceptImpression(campaign.id, 'too-late');
  expect(rejected.status()).toBe(409);
  expect((await rejected.json()).error).toBe('CAMPAIGN_STOPPED');
});

test('cancel follows a pending confirmation flow', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  const requested = await api.cancel(campaign.id);
  expect((await requested.json()).status).toBe('CANCEL_PENDING');

  const confirmed = await api.confirmStop(campaign.id);
  expect((await confirmed.json()).status).toBe('CANCELLED');
});

test('cannot pause a paused campaign twice', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.pause(campaign.id);
  await api.confirmStop(campaign.id);

  const again = await api.pause(campaign.id);
  expect(again.status()).toBe(409);
  expect((await again.json()).error).toBe('INVALID_STATE_TRANSITION');
});

test('cannot resume a cancelled campaign', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.cancel(campaign.id);
  await api.confirmStop(campaign.id);

  const response = await api.resume(campaign.id);
  expect(response.status()).toBe(409);
});

test('a paused campaign can resume and accept new impressions', async ({ request, api, campaignFactory, eventFactory }) => {
  const campaign = await campaignFactory.create();
  await api.pause(campaign.id);
  await api.confirmStop(campaign.id);

  const resumed = await api.resume(campaign.id);
  expect((await resumed.json()).status).toBe('ACTIVE');

  const accepted = await api.acceptImpression(campaign.id, 'after-resume');
  expect(accepted.status()).toBe(202);
  const processed = await api.processImpression(campaign.id, 'after-resume');
  expect((await processed.json()).status).toBe('DELIVERED');
});
