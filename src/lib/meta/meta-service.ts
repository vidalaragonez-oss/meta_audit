import { MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaApiResponse } from './types';

export interface MetaTimeRange {
  since: string;
  until: string;
}

export class MetaIntegrationService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  constructor(private accessToken: string) {}

  private async fetchFromGraph<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    url.searchParams.set('access_token', this.accessToken);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    // ADICIONADO: cache: 'no-store' para garantir dados em tempo real
    const response = await fetch(url.toString(), { 
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    });
    
    const data = await response.json();

    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data as T;
  }

  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const response = await this.fetchFromGraph<MetaApiResponse<MetaAdAccount>>('me/adaccounts', {
      fields: 'id,name,account_status,currency,amount_spent,balance',
      limit: '500'
    });
    return response.data;
  }

  private getTimeQuery(datePreset?: string, timeRange?: MetaTimeRange): string {
    if (timeRange && timeRange.since && timeRange.until) {
      return `time_range(${JSON.stringify(timeRange)})`;
    }
    return `date_preset(${datePreset || 'last_14d'})`;
  }

  private getActiveFilter(onlyActive?: boolean): string | undefined {
    if (onlyActive) {
      return JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]);
    }
    return undefined;
  }

  private readonly coreFields = 'spend,impressions,reach,frequency,clicks,cpc,cpm,ctr,inline_link_clicks,outbound_clicks,unique_inline_link_clicks,purchase_roas,website_purchase_roas,actions,action_values,cost_per_action_type';
  private readonly deepFields = 'video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions,video_thruplay_watched_actions,video_avg_time_watched_actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking';

  async getCampaigns(accountId: string, datePreset?: string, timeRange?: MetaTimeRange, onlyActive?: boolean): Promise<MetaCampaign[]> {
    const timeQuery = this.getTimeQuery(datePreset, timeRange);
    const fields = `id,name,status,effective_status,objective,insights.${timeQuery}{${this.coreFields}}`;
    const params: Record<string, string> = { fields, limit: '150' };
    const filter = this.getActiveFilter(onlyActive);
    if (filter) params.filtering = filter;
    const response = await this.fetchFromGraph<MetaApiResponse<MetaCampaign>>(`${accountId}/campaigns`, params);
    return response.data;
  }

  async getAdSets(campaignId: string, datePreset?: string, timeRange?: MetaTimeRange, onlyActive?: boolean): Promise<MetaAdSet[]> {
    const timeQuery = this.getTimeQuery(datePreset, timeRange);
    const fields = `id,name,status,effective_status,learning_stage,insights.${timeQuery}{${this.coreFields}}`;
    const params: Record<string, string> = { fields, limit: '150' };
    const filter = this.getActiveFilter(onlyActive);
    if (filter) params.filtering = filter;
    const response = await this.fetchFromGraph<MetaApiResponse<MetaAdSet>>(`${campaignId}/adsets`, params);
    return response.data;
  }

  async getAds(adSetId: string, datePreset?: string, timeRange?: MetaTimeRange, onlyActive?: boolean): Promise<MetaAd[]> {
    const timeQuery = this.getTimeQuery(datePreset, timeRange);
    const fields = `id,name,status,effective_status,insights.${timeQuery}{${this.coreFields},${this.deepFields}}`;
    const params: Record<string, string> = { fields, limit: '150' };
    const filter = this.getActiveFilter(onlyActive);
    if (filter) params.filtering = filter;
    const response = await this.fetchFromGraph<MetaApiResponse<MetaAd>>(`${adSetId}/ads`, params);
    return response.data;
  }

  async getAuditTree(accountId: string, datePreset?: string, timeRange?: MetaTimeRange, onlyActive?: boolean) {
    const campaigns = await this.getCampaigns(accountId, datePreset, timeRange, onlyActive);
    return await Promise.all(campaigns.map(async (campaign) => {
      const adSets = await this.getAdSets(campaign.id, datePreset, timeRange, onlyActive);
      const adSetsWithAds = await Promise.all(adSets.map(async (adSet) => {
        const ads = await this.getAds(adSet.id, datePreset, timeRange, onlyActive);
        return { ...adSet, ads };
      }));
      return { ...campaign, adSets: adSetsWithAds };
    }));
  }
}
