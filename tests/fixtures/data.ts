import { CampaignInput } from './types.js';

export const campaignData = {
  standard: { name: 'Streaming launch campaign', budgetCents: 1_000, costPerImpressionCents: 100 } satisfies CampaignInput,
  exactBudget: { name: 'Exact budget boundary', budgetCents: 200, costPerImpressionCents: 100 } satisfies CampaignInput,
  lowBudget: { name: 'Low budget campaign', budgetCents: 100, costPerImpressionCents: 100 } satisfies CampaignInput,
  highVolume: { name: 'High volume campaign', budgetCents: 500, costPerImpressionCents: 100 } satisfies CampaignInput
} as const;

export const invalidCampaignData = {
  missingName: { budgetCents: 1_000, costPerImpressionCents: 100 },
  emptyName: { name: '', budgetCents: 1_000, costPerImpressionCents: 100 },
  whitespaceName: { name: '  ', budgetCents: 1_000, costPerImpressionCents: 100 },
  tooShortName: { name: 'ab', budgetCents: 1_000, costPerImpressionCents: 100 },
  zeroBudget: { name: 'Invalid budget', budgetCents: 0, costPerImpressionCents: 100 },
  negativeBudget: { name: 'Invalid budget', budgetCents: -1, costPerImpressionCents: 100 },
  fractionalBudget: { name: 'Invalid budget', budgetCents: 1.5, costPerImpressionCents: 100 },
  zeroUnitCost: { name: 'Invalid cost', budgetCents: 1_000, costPerImpressionCents: 0 },
  negativeUnitCost: { name: 'Invalid cost', budgetCents: 1_000, costPerImpressionCents: -5 },
  fractionalUnitCost: { name: 'Invalid cost', budgetCents: 1_000, costPerImpressionCents: 2.25 }
} as const;

export const eventData = {
  beforePause: 'impression-before-pause',
  afterPause: 'impression-after-pause',
  duplicate: 'duplicate-impression-event',
  unknown: 'unknown-impression-event'
} as const;
