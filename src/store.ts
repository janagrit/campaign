import { Campaign, ImpressionEvent, LedgerEntry } from './domain.js';

export class InMemoryStore {
  readonly campaigns = new Map<string, Campaign>();
  readonly events = new Map<string, ImpressionEvent>();
  readonly ledger: LedgerEntry[] = [];

  reset(): void {
    this.campaigns.clear();
    this.events.clear();
    this.ledger.length = 0;
  }

  eventKey(campaignId: string, eventId: string): string {
    return `${campaignId}:${eventId}`;
  }

  getEvent(campaignId: string, eventId: string): ImpressionEvent | undefined {
    return this.events.get(this.eventKey(campaignId, eventId));
  }

  saveEvent(event: ImpressionEvent): void {
    this.events.set(this.eventKey(event.campaignId, event.eventId), event);
  }

  campaignLedger(campaignId: string): LedgerEntry[] {
    return this.ledger.filter(entry => entry.campaignId === campaignId);
  }

  billedCents(campaignId: string): number {
    return this.campaignLedger(campaignId).reduce((sum, entry) => sum + entry.amountCents, 0);
  }

  campaignEvents(campaignId: string): ImpressionEvent[] {
    return [...this.events.values()].filter(event => event.campaignId === campaignId);
  }
}
