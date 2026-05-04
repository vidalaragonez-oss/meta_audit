import { MetaCampaign, MetaAdSet, MetaAd } from '../meta/types';

export interface AuditFlag {
  severity: 'danger' | 'warning' | 'info' | 'success';
  message: string;
}

export interface ConversionDetail {
  type: string;
  value: number;
}

export interface Metrics {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  roas: number;
  leads: number;
  whatsapp: number;
  totalResults: number;
  conversions: ConversionDetail[];
  link_clicks: number;
  outbound_clicks: number;
  unique_link_clicks: number;
  ctrLink: number;
  v25: number;
  v50: number;
  v75: number;
  v95: number;
  v100: number;
  thruplays: number;
  avg_watch_time: number;
  hookRate: number;
  holdRate: number;
  cpl?: number;
  quality_ranking?: string;
  engagement_ranking?: string;
  conversion_ranking?: string;

  // NOVAS MÉTRICAS META STYLE
  spend_pct?: number;
  cost_per_reach?: number;
  video_p3s?: number;
  cost_per_p3s?: number;
  video_thruplay?: number;
  cost_per_thruplay?: number;
  video_p2s_continuous?: number;
  cost_per_p2s_continuous?: number;
  unique_outbound_clicks?: number;
  cost_per_outbound_click?: number;
  landing_page_views?: number;
  cost_per_lpv?: number;
  insta_profile_visits?: number;
  post_reactions?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  page_likes?: number;
  insta_followers?: number;
  post_engagement?: number;
  cost_per_engagement?: number;
  cost_per_post_engagement?: number;
  messaging_starts?: number;
  cost_per_messaging_start?: number;
  new_messaging_contacts?: number;
  cost_per_new_contact?: number;
  messaging_replies?: number;
  purchases?: number;
  purchase_value?: number;
  cost_per_purchase?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  delivery_status?: string;
  learning_stage?: string;
  result_rate?: number;
  result_value?: number;
  video_p2s_continuous_unique?: number;
  cpc_all?: number;
  ctr_link_unique?: number;
  cost_per_like?: number;
  page_engagement?: number;
  cost_per_page_engagement?: number;
  messaging_returns?: number;
}

export interface EnrichedCampaign {
  item: MetaCampaign;
  metrics: Metrics;
  flags: AuditFlag[];
  adSets: EnrichedAdSet[];
}

export interface EnrichedAdSet {
  item: MetaAdSet;
  metrics: Metrics;
  flags: AuditFlag[];
  ads: EnrichedAd[];
}

export interface EnrichedAd {
  item: MetaAd;
  metrics: Metrics;
  flags: AuditFlag[];
}

export class RuleEngineService {
  processAuditTree(tree: any[], targetCpl?: number) {
    const enrichedCampaigns = tree.map(campaign => this.processCampaign(campaign, targetCpl));
    const totalSpend = enrichedCampaigns.reduce((sum: number, c: EnrichedCampaign) => sum + c.metrics.spend, 0);
    const totalResults = enrichedCampaigns.reduce((sum: number, c: EnrichedCampaign) => sum + c.metrics.totalResults, 0);
    const avgCpl = totalResults > 0 ? totalSpend / totalResults : 0;
    return { results: enrichedCampaigns, baseline: { avgCpl } };
  }

  private processCampaign(campaign: any, targetCpl?: number): EnrichedCampaign {
    const enrichedAdSets = (campaign.adSets || []).map((adSet: any) => this.processAdSet(adSet, targetCpl, campaign.objective));
    const metrics = this.calculateMetrics(campaign.insights?.data?.[0], campaign.objective);
    
    metrics.delivery_status = campaign.effective_status;
    metrics.v25 = enrichedAdSets.reduce((sum: number, as: EnrichedAdSet) => sum + as.metrics.v25, 0);
    metrics.thruplays = enrichedAdSets.reduce((sum: number, as: EnrichedAdSet) => sum + as.metrics.thruplays, 0);
    metrics.hookRate = metrics.impressions > 0 ? (metrics.v25 / metrics.impressions) * 100 : 0;
    metrics.holdRate = metrics.v25 > 0 ? (metrics.thruplays / metrics.v25) * 100 : 0;

    const flags = this.generateDiagnostics(metrics, targetCpl);
    return { item: campaign, metrics, flags, adSets: enrichedAdSets };
  }

  private processAdSet(adSet: any, targetCpl?: number, objective?: string): EnrichedAdSet {
    const enrichedAds = (adSet.ads || []).map((ad: any) => this.processAd(ad, targetCpl, objective));
    const metrics = this.calculateMetrics(adSet.insights?.data?.[0], objective);
    
    metrics.delivery_status = adSet.effective_status;
    metrics.learning_stage = adSet.learning_stage;
    metrics.v25 = enrichedAds.reduce((sum: number, a: EnrichedAd) => sum + a.metrics.v25, 0);
    metrics.thruplays = enrichedAds.reduce((sum: number, a: EnrichedAd) => sum + a.metrics.thruplays, 0);
    metrics.hookRate = metrics.impressions > 0 ? (metrics.v25 / metrics.impressions) * 100 : 0;
    metrics.holdRate = metrics.v25 > 0 ? (metrics.thruplays / metrics.v25) * 100 : 0;

    const flags = this.generateDiagnostics(metrics, targetCpl);
    return { item: adSet, metrics, flags, ads: enrichedAds };
  }

  private processAd(ad: any, targetCpl?: number, objective?: string): EnrichedAd {
    const metrics = this.calculateMetrics(ad.insights?.data?.[0], objective);
    metrics.delivery_status = ad.effective_status;
    metrics.quality_ranking = ad.insights?.data?.[0]?.quality_ranking;
    metrics.engagement_ranking = ad.insights?.data?.[0]?.engagement_rate_ranking;
    metrics.conversion_ranking = ad.insights?.data?.[0]?.conversion_rate_ranking;
    const flags = this.generateDiagnostics(metrics, targetCpl);
    return { item: ad, metrics, flags };
  }

  private calculateMetrics(insights: any, objective?: string): Metrics {
    if (!insights) return this.emptyMetrics();
    
    const spend = parseFloat(insights.spend || '0');
    const impressions = parseInt(insights.impressions || '0');
    const reach = parseInt(insights.reach || '0');
    const frequency = parseFloat(insights.frequency || '1');
    const clicks = parseInt(insights.clicks || '0');
    const link_clicks = parseInt(insights.inline_link_clicks || '0');
    const outbound_clicks = this.extractActionValue(insights.outbound_clicks, 'outbound_click');
    const unique_outbound_clicks = this.extractActionValue(insights.outbound_clicks, 'unique_outbound_click');
    const unique_link_clicks = parseInt(insights.unique_inline_link_clicks || '0');
    
    const roasActions = insights.purchase_roas || insights.website_purchase_roas || [];
    const roas = roasActions.length > 0 ? parseFloat(roasActions[0].value) : 0;

    const actions = insights.actions || [];
    const actionValues = insights.action_values || [];
    
    // Resultados
    let totalResults = 0;
    const whatsapp = this.extractActionValue(actions, 'onsite_conversion.messaging_conversation_started_7d') || 
                     this.extractActionValue(actions, 'messaging_conversation_started_7d');
                     
    const leads = this.extractActionValue(actions, 'onsite_conversion.lead') + 
                  this.extractActionValue(actions, 'lead');
                  
    const purchases = this.extractActionValue(actions, 'purchase') + 
                      this.extractActionValue(actions, 'onsite_conversion.purchase');

    if (objective === 'OUTCOME_MESSAGING' || objective === 'MESSAGES') {
      totalResults = whatsapp;
    } else if (objective === 'OUTCOME_SALES' || objective === 'CONVERSIONS') {
      totalResults = purchases;
    } else if (objective === 'OUTCOME_LEADS' || objective === 'LEAD_GENERATION') {
      totalResults = leads;
    } else {
      totalResults = Math.max(whatsapp, leads, purchases);
      if (totalResults === 0) totalResults = link_clicks;
    }

    const conversions: ConversionDetail[] = [];
    if (whatsapp > 0) conversions.push({ type: 'WHATSAPP', value: whatsapp });
    if (leads > 0) conversions.push({ type: 'LEADS', value: leads });
    if (purchases > 0) conversions.push({ type: 'PURCHASES', value: purchases });

    // Mídia
    const v3s = this.extractActionValue(actions, 'video_view');
    const thruplays = this.extractActionValue(insights.video_thruplay_watched_actions, 'video_view');
    const p2sContinuous = this.extractActionValue(insights.video_continuous_2s_watched_actions, 'video_view');
    const vp25 = this.extractActionValue(insights.video_p25_watched_actions, 'video_view');

    // Engajamento
    const reactions = this.extractActionValue(actions, 'post_reaction');
    const comments = this.extractActionValue(actions, 'comment');
    const shares = this.extractActionValue(actions, 'post_share');
    const saves = this.extractActionValue(actions, 'post_save');
    const pageLikes = this.extractActionValue(actions, 'like');
    const postEngagement = reactions + comments + shares + saves;
    const pageEngagement = this.extractActionValue(actions, 'page_engagement');

    // Tráfego
    const lpv = this.extractActionValue(actions, 'landing_page_view');
    const instaProfileVisits = this.extractActionValue(actions, 'instagram_profile_visit');
    const instaFollowers = this.extractActionValue(actions, 'instagram_follower');

    // Mensagens
    const newContacts = this.extractActionValue(actions, 'new_messaging_contact') || 
                        this.extractActionValue(actions, 'messaging_first_reply') ||
                        this.extractActionValue(actions, 'onsite_conversion.messaging_first_reply');
                        
    const messagingReplies = this.extractActionValue(actions, 'messaging_reply');

    const purchaseValue = this.extractActionValue(actionValues, 'purchase') + this.extractActionValue(actionValues, 'onsite_conversion.purchase');

    return { 
      spend, impressions, reach, frequency, clicks, link_clicks, outbound_clicks, unique_link_clicks, roas,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      ctrLink: impressions > 0 ? (link_clicks / impressions) * 100 : 0,
      cpc: link_clicks > 0 ? spend / link_clicks : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      leads, whatsapp, totalResults, conversions,
      cpl: totalResults > 0 ? spend / totalResults : undefined,
      v25: vp25,
      v50: this.extractActionValue(insights.video_p50_watched_actions, 'video_view'),
      v75: this.extractActionValue(insights.video_p75_watched_actions, 'video_view'),
      v95: this.extractActionValue(insights.video_p95_watched_actions, 'video_view'),
      v100: this.extractActionValue(insights.video_p100_watched_actions, 'video_view'),
      thruplays,
      avg_watch_time: this.extractActionValue(insights.video_avg_time_watched_actions, 'video_view'),
      hookRate: impressions > 0 ? (vp25 / impressions) * 100 : 0,
      holdRate: vp25 > 0 ? (thruplays / vp25) * 100 : 0,

      // NOVAS MÉTRICAS META STYLE CÁLCULO
      result_rate: impressions > 0 ? (totalResults / impressions) * 100 : 0,
      result_value: purchaseValue,
      spend_pct: 0,
      cost_per_reach: reach > 0 ? (spend / reach) * 1000 : 0,
      video_p3s: v3s,
      cost_per_p3s: v3s > 0 ? spend / v3s : 0,
      video_thruplay: thruplays,
      cost_per_thruplay: thruplays > 0 ? spend / thruplays : 0,
      video_p2s_continuous: p2sContinuous,
      video_p2s_continuous_unique: 0, 
      cost_per_p2s_continuous: p2sContinuous > 0 ? spend / p2sContinuous : 0,
      cpc_all: clicks > 0 ? spend / clicks : 0,
      ctr_link_unique: impressions > 0 ? (unique_link_clicks / impressions) * 100 : 0,
      unique_outbound_clicks: unique_outbound_clicks,
      cost_per_outbound_click: outbound_clicks > 0 ? spend / outbound_clicks : 0,
      landing_page_views: lpv,
      cost_per_lpv: lpv > 0 ? spend / lpv : 0,
      insta_profile_visits: instaProfileVisits,
      post_reactions: reactions,
      comments,
      shares,
      saves,
      page_likes: pageLikes,
      insta_followers: instaFollowers,
      cost_per_like: pageLikes > 0 ? spend / pageLikes : 0,
      post_engagement: postEngagement,
      cost_per_post_engagement: postEngagement > 0 ? spend / postEngagement : 0,
      page_engagement: pageEngagement,
      cost_per_page_engagement: pageEngagement > 0 ? spend / pageEngagement : 0,
      messaging_starts: whatsapp,
      cost_per_messaging_start: whatsapp > 0 ? spend / whatsapp : 0,
      new_messaging_contacts: newContacts,
      cost_per_new_contact: newContacts > 0 ? spend / newContacts : 0,
      messaging_replies: messagingReplies,
      messaging_returns: 0,
      purchases,
      purchase_value: purchaseValue,
      cost_per_purchase: purchases > 0 ? spend / purchases : 0,
      add_to_cart: this.extractActionValue(actions, 'add_to_cart'),
      initiate_checkout: this.extractActionValue(actions, 'initiate_checkout')
    };
  }

  private generateDiagnostics(metrics: Metrics, targetCpl?: number): AuditFlag[] {
    const flags: AuditFlag[] = [];
    if (metrics.spend > 0) {
      if (metrics.hookRate > 0 && metrics.hookRate < 15) flags.push({ severity: 'danger', message: "GANCHO FRACO" });
      if (targetCpl && metrics.cpl && metrics.cpl > targetCpl * 1.2) flags.push({ severity: 'danger', message: "CPL ALTO" });
    }
    return flags;
  }

  private extractActionValue(actions: any[], type: string): number {
    if (!actions || !Array.isArray(actions)) return 0;
    const action = actions.find((a: any) => a.action_type === type);
    return action ? parseInt(action.value) : 0;
  }

  private emptyMetrics(): Metrics {
    return { 
      spend: 0, impressions: 0, reach: 0, frequency: 1, clicks: 0, link_clicks: 0, outbound_clicks: 0, unique_link_clicks: 0,
      roas: 0, ctr: 0, ctrLink: 0, cpc: 0, cpm: 0, leads: 0, whatsapp: 0, totalResults: 0, conversions: [],
      v25: 0, v50: 0, v75: 0, v95: 0, v100: 0, thruplays: 0, avg_watch_time: 0, hookRate: 0, holdRate: 0
    };
  }
}
