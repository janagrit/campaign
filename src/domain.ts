export type CampaignStatus =
  | 'ACTIVE'
  | 'PAUSE_PENDING'
  | 'PAUSED'
  | 'CANCEL_PENDING'
  | 'CANCELLED';

export type ImpressionStatus = 'PENDING' | 'DELIVERED' | 'REJECTED';

export interface Campaign {
  id: string;
  name: string;
  budgetCents: number;
  costPerImpressionCents: number;
  status: CampaignStatus;
  createdAt: number;
  stopRequestedAt?: number;
  stoppedAt?: number;
  stoppedSequence?: number;
}

export interface ImpressionEvent {
  eventId: string;
  campaignId: string;
  status: ImpressionStatus;
  acceptedAt: number;
  acceptedSequence: number;
  processedAt?: number;
  billedCents: number;
  rejectionReason?: string;
}

export interface LedgerEntry {
  id: string;
  campaignId: string;
  eventId: string;
  amountCents: number;
  createdAt: number;
}

export interface ApiError {
  error: string;
  message: string;
}
