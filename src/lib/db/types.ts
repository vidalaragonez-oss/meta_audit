export interface AppSettings {
  id?: string;
  metaAccessToken: string;
  anthropicApiKey?: string;
  targetCpl: number;
  auditPrompt: string;
  selectedColumns: string[];
  updatedAt: Date;
}

export const DEFAULT_COLUMNS = [
  'results',
  'cost_per_result',
  'spend',
  'impressions',
  'ctr_link',
  'cpl'
];

export const AVAILABLE_COLUMNS = [
  // 1. Resultados e investimento
  { id: 'results', label: 'Resultados', category: '1. Resultados e Investimento' },
  { id: 'cost_per_result', label: 'Custo por Resultado', category: '1. Resultados e Investimento' },
  { id: 'roas', label: 'ROAS de Resultados', category: '1. Resultados e Investimento' },
  { id: 'result_rate', label: 'Índice de Resultados', category: '1. Resultados e Investimento' },
  { id: 'result_value', label: 'Valor dos Resultados', category: '1. Resultados e Investimento' },
  { id: 'spend', label: 'Valor Usado', category: '1. Resultados e Investimento' },
  { id: 'spend_pct', label: 'Porcentagem do Valor Gasto', category: '1. Resultados e Investimento' },

  // 2. Distribuição
  { id: 'impressions', label: 'Impressões', category: '2. Distribuição' },
  { id: 'reach', label: 'Alcance', category: '2. Distribuição' },
  { id: 'frequency', label: 'Frequência', category: '2. Distribuição' },
  { id: 'cpm', label: 'CPM (Custo por 1.000 Impressões)', category: '2. Distribuição' },
  { id: 'cost_per_reach', label: 'Custo por 1.000 Contas Alcançadas', category: '2. Distribuição' },

  // 3. Mídia
  { id: 'video_p3s', label: 'Reproduções de Vídeo (3s)', category: '3. Mídia' },
  { id: 'cost_per_p3s', label: 'Custo por Reprodução (3s)', category: '3. Mídia' },
  { id: 'video_thruplay', label: 'ThruPlays', category: '3. Mídia' },
  { id: 'cost_per_thruplay', label: 'Custo por ThruPlay', category: '3. Mídia' },
  { id: 'video_p2s_continuous', label: 'Reprod. Contínuas (2s)', category: '3. Mídia' },
  { id: 'cost_per_p2s_continuous', label: 'Custo por Reprod. Contínua (2s)', category: '3. Mídia' },
  { id: 'video_p2s_continuous_unique', label: 'Reprod. Contínuas Únicas (2s)', category: '3. Mídia' },
  { id: 'avg_watch_time', label: 'Tempo Médio Assistido', category: '3. Mídia' },

  // 4. Engajamento - Cliques
  { id: 'clicks', label: 'Cliques (Todos)', category: '4. Engajamento - Cliques' },
  { id: 'ctr_all', label: 'CTR (Todos)', category: '4. Engajamento - Cliques' },
  { id: 'cpc_all', label: 'CPC (Todos)', category: '4. Engajamento - Cliques' },
  { id: 'link_clicks', label: 'Cliques no Link', category: '4. Engajamento - Cliques' },
  { id: 'ctr_link', label: 'CTR (Taxa de Cliques no Link)', category: '4. Engajamento - Cliques' },
  { id: 'cpc', label: 'CPC (Custo por Clique no Link)', category: '4. Engajamento - Cliques' },
  { id: 'unique_link_clicks', label: 'Cliques no Link Únicos', category: '4. Engajamento - Cliques' },
  { id: 'ctr_link_unique', label: 'CTR Único (Link)', category: '4. Engajamento - Cliques' },
  { id: 'outbound_clicks', label: 'Cliques de Saída', category: '4. Engajamento - Cliques' },
  { id: 'unique_outbound_clicks', label: 'Cliques de Saída Únicos', category: '4. Engajamento - Cliques' },
  { id: 'cost_per_outbound_click', label: 'Custo por Clique de Saída', category: '4. Engajamento - Cliques' },

  // 5. Engajamento - Tráfego
  { id: 'landing_page_views', label: 'Visualizações da Página de Destino', category: '5. Engajamento - Tráfego' },
  { id: 'cost_per_lpv', label: 'Custo por LPV', category: '5. Engajamento - Tráfego' },
  { id: 'insta_profile_visits', label: 'Visitas ao Perfil do Instagram', category: '5. Engajamento - Tráfego' },

  // 6. Engajamento - Seguidores e curtidas
  { id: 'page_likes', label: 'Curtidas da Página (FB)', category: '6. Seguidores e Curtidas' },
  { id: 'insta_followers', label: 'Seguidores no Instagram', category: '6. Seguidores e Curtidas' },
  { id: 'cost_per_like', label: 'Custo por Curtida', category: '6. Seguidores e Curtidas' },

  // 7. Engajamento - Interações
  { id: 'post_reactions', label: 'Reações ao Post', category: '7. Engajamento - Interações' },
  { id: 'comments', label: 'Comentários no Post', category: '7. Engajamento - Interações' },
  { id: 'shares', label: 'Compartilhamentos do Post', category: '7. Engajamento - Interações' },
  { id: 'saves', label: 'Salvamentos do Post', category: '7. Engajamento - Interações' },
  { id: 'post_engagement', label: 'Engajamento com o Post', category: '7. Engajamento - Interações' },
  { id: 'cost_per_post_engagement', label: 'Custo por Engajamento com Post', category: '7. Engajamento - Interações' },
  { id: 'page_engagement', label: 'Engajamento com a Página', category: '7. Engajamento - Interações' },
  { id: 'cost_per_page_engagement', label: 'Custo por Engajamento com Página', category: '7. Engajamento - Interações' },

  // 8. Mensagens
  { id: 'messaging_starts', label: 'Conversas Iniciadas', category: '8. Mensagens' },
  { id: 'cost_per_messaging_start', label: 'Custo por Conversa Iniciada', category: '8. Mensagens' },
  { id: 'new_messaging_contacts', label: 'Novos Contatos de Mensagem', category: '8. Mensagens' },
  { id: 'cost_per_new_contact', label: 'Custo por Novo Contato', category: '8. Mensagens' },
  { id: 'messaging_replies', label: 'Conversas Respondidas', category: '8. Mensagens' },
  { id: 'messaging_returns', label: 'Contatos que Retornam', category: '8. Mensagens' },

  // 9. Conversões
  { id: 'leads', label: 'Leads', category: '9. Conversões' },
  { id: 'cpl', label: 'Custo por Lead', category: '9. Conversões' },
  { id: 'purchases', label: 'Compras', category: '9. Conversões' },
  { id: 'purchase_value', label: 'Valor de Conversão de Compras', category: '9. Conversões' },
  { id: 'cost_per_purchase', label: 'Custo por Compra (CPA)', category: '9. Conversões' },
  { id: 'add_to_cart', label: 'Adições ao Carrinho', category: '9. Conversões' },
  { id: 'initiate_checkout', label: 'Inícios de Checkout', category: '9. Conversões' }
];
