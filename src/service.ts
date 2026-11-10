import { randomUUID } from 'node:crypto';
import { Campaign, ImpressionEvent, LedgerEntry } from './domain.js';
import { InMemoryStore } from './store.js';

export class DomainError extends Error {
  constructor(readonly code: string, message: string, readonly statusCode = 409) {
    super(message);
  }
}

export class CampaignService {
  private operationSequence = 0;

  private nextSequence(): number {
    this.operationSequence += 1;
    return this.operationSequence;
  }

  constructor(
    private readonly store: InMemoryStore,
    private readonly defects: Set<string>,
    private readonly clock: () => number = () => Date.now()
  ) {}

  createCampaign(input: { name: unknown; budgetCents: unknown; costPerImpressionCents: unknown }): Campaign {
    if (typeof input.name !== 'string' || input.name.trim().length < 3 || input.name.trim().length > 100) {
      throw new DomainError('INVALID_NAME', 'Campaign name must contain 3–100 characters.', 400);
    }
    if (!Number.isSafeInteger(input.budgetCents) || Number(input.budgetCents) <= 0) {
      throw new DomainError('INVALID_BUDGET', 'Budget must be a positive integer in cents.', 400);
    }
    if (!Number.isSafeInteger(input.costPerImpressionCents) || Number(input.costPerImpressionCents) <= 0) {
      throw new DomainError('INVALID_UNIT_COST', 'Cost per impression must be a positive integer in cents.', 400);
    }

    const campaign: Campaign = {
      id: randomUUID(),
      name: input.name.trim(),
      budgetCents: Number(input.budgetCents),
      costPerImpressionCents: Number(input.costPerImpressionCents),
      status: 'ACTIVE',
      createdAt: this.clock()
    };
    this.store.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getCampaign(id: string): Campaign {
    const campaign = this.store.campaigns.get(id);
    if (!campaign) throw new DomainError('CAMPAIGN_NOT_FOUND', 'Campaign does not exist.', 404);
    return campaign;
  }

  requestStop(id: string, action: 'pause' | 'cancel'): Campaign {
    const campaign = this.getCampaign(id);
    if (action === 'pause') {
      if (campaign.status !== 'ACTIVE') {
        throw new DomainError('INVALID_STATE_TRANSITION', `Cannot pause campaign in ${campaign.status}.`);
      }
      campaign.status = 'PAUSE_PENDING';
    } else {
      if (!['ACTIVE', 'PAUSED'].includes(campaign.status)) {
        throw new DomainError('INVALID_STATE_TRANSITION', `Cannot cancel campaign in ${campaign.status}.`);
      }
      campaign.status = 'CANCEL_PENDING';
    }
    campaign.stopRequestedAt = this.clock();
    return campaign;
  }

  confirmStop(id: string): Campaign {
    const campaign = this.getCampaign(id);
    if (campaign.status === 'PAUSE_PENDING') campaign.status = 'PAUSED';
    else if (campaign.status === 'CANCEL_PENDING') campaign.status = 'CANCELLED';
    else throw new DomainError('STOP_NOT_PENDING', 'No stop request is awaiting confirmation.');
    campaign.stoppedAt = this.clock();
    campaign.stoppedSequence = this.nextSequence();
    return campaign;
  }

  resume(id: string): Campaign {
    const campaign = this.getCampaign(id);
    if (campaign.status !== 'PAUSED') {
      throw new DomainError('CAMPAIGN_NOT_PAUSED', 'Only a paused campaign can be resumed.');
    }
    campaign.status = 'ACTIVE';
    campaign.stopRequestedAt = undefined;
    campaign.stoppedAt = undefined;
    campaign.stoppedSequence = undefined;
    return campaign;
  }

  acceptImpression(campaignId: string, eventId: unknown): { event: ImpressionEvent; duplicate: boolean } {
    const campaign = this.getCampaign(campaignId);
    if (typeof eventId !== 'string' || eventId.trim().length < 1 || eventId.length > 150) {
      throw new DomainError('INVALID_EVENT_ID', 'Event ID must contain 1–150 characters.', 400);
    }

    const existing = this.store.getEvent(campaignId, eventId);
    if (existing && !this.defects.has('duplicate-charge')) return { event: existing, duplicate: true };

    const stopped = campaign.status === 'PAUSED' || campaign.status === 'CANCELLED';
    if (stopped && !this.defects.has('post-stop-admission')) {
      throw new DomainError('CAMPAIGN_STOPPED', 'New impressions are not accepted after stop confirmation.');
    }

    const event: ImpressionEvent = {
      eventId,
      campaignId,
      status: 'PENDING',
      acceptedAt: this.clock(),
      acceptedSequence: this.nextSequence(),
      billedCents: 0
    };
    this.store.saveEvent(event);
    return { event, duplicate: false };
  }

  processImpression(campaignId: string, eventId: string): ImpressionEvent {
    const campaign = this.getCampaign(campaignId);
    const event = this.store.getEvent(campaignId, eventId);
    if (!event) throw new DomainError('EVENT_NOT_FOUND', 'Impression event does not exist.', 404);
    if (event.status !== 'PENDING' && !this.defects.has('duplicate-charge')) return event;

    // A queued event accepted before stop confirmation is considered in flight.
    // It can complete and be billed even if the campaign is now PAUSED/CANCELLED.
    if (campaign.stoppedSequence !== undefined && event.acceptedSequence > campaign.stoppedSequence) {
      event.status = 'REJECTED';
      event.rejectionReason = 'ACCEPTED_AFTER_STOP';
      event.processedAt = this.clock();
      return event;
    }

    const nextSpend = this.store.billedCents(campaignId) + campaign.costPerImpressionCents;
    if (nextSpend > campaign.budgetCents && !this.defects.has('budget-race')) {
      event.status = 'REJECTED';
      event.rejectionReason = 'BUDGET_EXCEEDED';
      event.processedAt = this.clock();
      return event;
    }

    event.status = 'DELIVERED';
    event.processedAt = this.clock();
    event.billedCents = campaign.costPerImpressionCents;

    const ledgerEntry: LedgerEntry = {
      id: randomUUID(),
      campaignId,
      eventId,
      amountCents: event.billedCents,
      createdAt: this.clock()
    };
    this.store.ledger.push(ledgerEntry);
    return event;
  }

  report(id: string) {
    const campaign = this.getCampaign(id);
    const events = this.store.campaignEvents(id);
    const delivered = events.filter(event => event.status === 'DELIVERED');
    const ledger = this.store.campaignLedger(id);
    const ledgerTotalCents = this.store.billedCents(id);
    const spendCents = this.defects.has('report-drift') ? ledgerTotalCents + 1 : ledgerTotalCents;
    return {
      campaignId: id,
      status: campaign.status,
      impressions: delivered.length,
      spendCents,
      ledgerEntries: ledger.length,
      ledgerSpendCents: ledgerTotalCents,
      budgetCents: campaign.budgetCents,
      reconciled: delivered.length === ledger.length && spendCents === ledgerTotalCents
    };
  }

  snapshot(id: string) {
    const campaign = this.getCampaign(id);
    return {
      campaign,
      events: this.store.campaignEvents(id),
      ledger: this.store.campaignLedger(id),
      billedCents: this.store.billedCents(id)
    };
  }
}
