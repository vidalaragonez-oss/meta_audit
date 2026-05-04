export interface MetaInsight {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  inline_link_clicks?: string;
  outbound_clicks?: MetaAction[];
  unique_inline_link_clicks?: string;
  purchase_roas?: MetaAction[];
  website_purchase_roas?: MetaAction[];
  video_p25_watched_actions?: MetaAction[];
  video_p50_watched_actions?: MetaAction[];
  video_p75_watched_actions?: MetaAction[];
  video_p95_watched_actions?: MetaAction[];
  video_p100_watched_actions?: MetaAction[];
  video_thruplay_watched_actions?: MetaAction[];
  video_avg_time_watched_actions?: MetaAction[];
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
}

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  amount_spent: string;
  balance: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: {
    data: MetaInsight[];
  };
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  learning_stage?: string;
  optimization_goal: string;
  bid_strategy: string;
  daily_budget?: string;
  insights?: {
    data: MetaInsight[];
  };
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  creative?: {
    id: string;
    title?: string;
    body?: string;
    thumbnail_url?: string;
  };
  insights?: {
    data: MetaInsight[];
  };
}

export interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}
