import { CampaignDto, CampaignInput } from '../../src/contracts/campaign.js';
export type { CampaignDto, CampaignInput } from '../../src/contracts/campaign.js';

export interface CampaignFactory {
  create(overrides?: Partial<CampaignInput>): Promise<CampaignDto>;
}
export interface EventFactory {
  next(prefix?: string): string;
}
