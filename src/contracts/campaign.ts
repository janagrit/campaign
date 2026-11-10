export interface CampaignInput {
  name: string;
  budgetCents: number;
  costPerImpressionCents: number;
}

export interface CampaignDto extends CampaignInput {
  id: string;
  status: string;
  createdAt: number;
}

export interface ApiErrorDto {
  error: string;
  message: string;
}
