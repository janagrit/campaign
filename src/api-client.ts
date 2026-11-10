import { APIRequestContext, APIResponse } from '@playwright/test';
import { CampaignInput } from './contracts/campaign.js';

export class CampaignApi {
  constructor(private readonly request: APIRequestContext) {}
  createCampaign(input: CampaignInput | Record<string, unknown>): Promise<APIResponse> { return this.request.post('/api/campaigns', { data: input }); }
  campaign(id: string): Promise<APIResponse> { return this.request.get(`/api/campaigns/${id}`); }
  pause(id: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/pause`); }
  cancel(id: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/cancel`); }
  confirmStop(id: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/confirm-stop`); }
  resume(id: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/resume`); }
  acceptImpression(id: string, eventId: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/impressions`, { data: { eventId } }); }
  processImpression(id: string, eventId: string): Promise<APIResponse> { return this.request.post(`/api/campaigns/${id}/impressions/${encodeURIComponent(eventId)}/process`); }
  ledger(id: string): Promise<APIResponse> { return this.request.get(`/api/campaigns/${id}/ledger`); }
  report(id: string): Promise<APIResponse> { return this.request.get(`/api/campaigns/${id}/report`); }
}
