'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuditStore } from '@/lib/store';
import { getAccounts, startAudit, saveSettingsAction, getSettingsAction } from './actions/audit';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Zap, Database, Download, Settings as SettingsIcon, ChevronRight, Check, User, Bell, Search, ChevronDown, Columns, Star, Copy } from 'lucide-react';
import { AppSettings, AVAILABLE_COLUMNS, DEFAULT_COLUMNS } from '@/lib/db/types';

const PRESETS = [
  { label: '7D', value: 'last_7d' },
  { label: '14D', value: 'last_14d' },
  { label: '30D', value: 'last_30d' },
  { label: 'MÁX', value: 'maximum' },
];

export default function Home() {
  const { 
    accounts, 
    selectedAccountId, 
    startDate,
    endDate,
    datePreset,
    showActiveOnly,
    auditResults, 
    selectedCampaignIds,
    isLoading, 
    setAccounts, 
    setSelectedAccount, 
    setDateRange,
    setDatePreset,
    setShowActiveOnly,
    setAuditResults, 
    toggleCampaignSelection,
    toggleAllCampaigns,
    setLoading,
    favoriteAccountIds,
    toggleFavoriteAccount
  } = useAuditStore();

  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    metaAccessToken: '',
    targetCpl: 0,
    auditPrompt: '',
    selectedColumns: DEFAULT_COLUMNS,
    updatedAt: new Date(),
  });

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const [expandedAdSets, setExpandedAdSets] = useState<string[]>([]);
  const [showDumpDialog, setShowDumpDialog] = useState(false);
  const [dumpContent, setDumpContent] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    loadInitialData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (selectedAccountId && (datePreset || (startDate && endDate))) {
      handleStartAudit();
    }
  }, [selectedAccountId, datePreset, startDate, endDate, showActiveOnly]);

  async function loadInitialData() {
    setLoading(true);
    const config = await getSettingsAction();
    if (config.success && config.data) {
      const data = config.data;
      if (!data.selectedColumns || data.selectedColumns.length === 0) {
        data.selectedColumns = DEFAULT_COLUMNS;
      }
      setSettings(data);
      if (data.metaAccessToken) {
        const res = await getAccounts();
        if (res.success && res.data) setAccounts(res.data);
      }
    }
    setLoading(false);
  }

  async function handleUpdateSettings(data: Partial<AppSettings>) {
    const updated = { ...settings, ...data };
    setSettings(updated);
    await saveSettingsAction(updated);
  }

  async function handleSaveSettings() {
    setLoading(true);
    const res = await saveSettingsAction(settings);
    if (res.success) {
      toast.success('CONFIGURAÇÕES SALVAS');
      loadInitialData();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  async function handleStartAudit() {
    if (!selectedAccountId) return;
    setLoading(true);
    
    let timeRange = null;
    if (startDate && endDate) {
      timeRange = { since: startDate, until: endDate };
    }
    
    const res = await startAudit(selectedAccountId, datePreset, timeRange, showActiveOnly);
    if (res.success && res.data) setAuditResults(res.data);
    else toast.error(res.error);
    setLoading(false);
  }

  const DateRangePicker = () => {
    const presets = [
      { id: 'today', label: 'Hoje' },
      { id: 'yesterday', label: 'Ontem' },
      { id: 'today_yesterday', label: 'Hoje e ontem' },
      { id: 'last_7d', label: 'Últimos 7 dias' },
      { id: 'last_14d', label: 'Últimos 14 dias' },
      { id: 'last_30d', label: 'Últimos 30 dias' },
      { id: 'this_week', label: 'Esta semana' },
      { id: 'last_week', label: 'Semana passada' },
      { id: 'this_month', label: 'Este mês' },
      { id: 'last_month', label: 'Mês passado' },
      { id: 'maximum', label: 'Máximo' },
    ];

    const [tempStart, setTempStart] = useState(startDate || '');
    const [tempEnd, setTempEnd] = useState(endDate || '');
    const [tempPreset, setTempPreset] = useState<string | null>(datePreset || 'last_30d');

    const handleApply = () => {
      if (tempPreset) {
        setDatePreset(tempPreset);
      } else if (tempStart && tempEnd) {
        setDateRange(tempStart, tempEnd);
      }
      toast.success('PERÍODO ATUALIZADO');
    };

    const calculatePresetDates = (id: string) => {
      const now = new Date();
      let since = new Date();
      let until = new Date();

      switch (id) {
        case 'today': break;
        case 'yesterday':
          since.setDate(now.getDate() - 1);
          until.setDate(now.getDate() - 1);
          break;
        case 'today_yesterday':
          since.setDate(now.getDate() - 1);
          break;
        case 'last_7d':
          since.setDate(now.getDate() - 7);
          break;
        case 'last_14d':
          since.setDate(now.getDate() - 14);
          break;
        case 'last_30d':
          since.setDate(now.getDate() - 30);
          break;
        case 'this_week':
          since.setDate(now.getDate() - now.getDay());
          break;
        case 'last_week':
          since.setDate(now.getDate() - now.getDay() - 7);
          until.setDate(now.getDate() - now.getDay() - 1);
          break;
        case 'this_month':
          since = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          until = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'maximum':
          return 'Período Total';
      }

      const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
      return `${formatDate(since)} - ${formatDate(until)}`;
    };

    const formatDateDisplay = () => {
      if (datePreset) {
        const p = presets.find(p => p.id === datePreset);
        return p ? p.label : datePreset;
      }
      return startDate && endDate ? `${startDate} a ${endDate}` : 'Período';
    };

    return (
      <Dialog>
        <DialogTrigger render={
          <div className="flex items-center gap-3 px-6 py-2 bg-[#121212] border border-[#1f1f1f] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-white transition-all group cursor-pointer">
            <Bell className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
            <span>{formatDateDisplay()}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        } />
        <DialogContent className="bg-[#0c0c0c] border-[#1f1f1f] text-[#e5e5e5] rounded-3xl shadow-2xl sm:max-w-5xl w-full p-0 overflow-hidden flex h-[600px]">
          {/* Sidebar Presets */}
          <div className="w-64 border-r border-[#1f1f1f] bg-[#080808] overflow-y-auto custom-scrollbar">
            <div className="p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-4">Períodos Sugeridos</h4>
              <div className="space-y-1">
                {presets.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setTempPreset(p.id); setTempStart(''); setTempEnd(''); }}
                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-between group ${tempPreset === p.id ? 'bg-primary/10 text-primary' : 'text-[#555] hover:bg-[#111] hover:text-[#888]'}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span>{p.label}</span>
                      <span className="text-[8px] opacity-40 font-medium normal-case">{calculatePresetDates(p.id)}</span>
                    </div>
                    {tempPreset === p.id && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Area (Simplified for UX Demo) */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-10 flex flex-col justify-center">
              <div className="flex items-center gap-8 mb-10">
                <div className="flex-1 space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-[#444]">Data Inicial</Label>
                  <Input 
                    type="date" 
                    value={tempStart} 
                    onChange={e => { setTempStart(e.target.value); setTempPreset(null); }}
                    className="bg-[#111] border-[#1f1f1f] text-xs h-14 rounded-2xl focus:border-primary transition-all"
                  />
                </div>
                <div className="text-[#1f1f1f] mt-6"><ChevronRight /></div>
                <div className="flex-1 space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-[#444]">Data Final</Label>
                  <Input 
                    type="date" 
                    value={tempEnd} 
                    onChange={e => { setTempEnd(e.target.value); setTempPreset(null); }}
                    className="bg-[#111] border-[#1f1f1f] text-xs h-14 rounded-2xl focus:border-primary transition-all"
                  />
                </div>
              </div>
              
              <div className="p-8 bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Database className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Visualização Forense</p>
                  <p className="text-[9px] text-[#555] uppercase font-bold">Os dados serão minerados seguindo este intervalo específico da Graph API.</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-[#1f1f1f] bg-[#080808] flex justify-end gap-4">
              <button className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#444] hover:text-white transition-all">Cancelar</button>
              <button 
                onClick={handleApply}
                className="px-10 py-4 bg-primary text-[#0c0c0c] font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                Atualizar Período
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const toggleColumn = (colId: string) => {
    const cols = settings.selectedColumns.includes(colId)
      ? settings.selectedColumns.filter(c => c !== colId)
      : [...settings.selectedColumns, colId];
    handleUpdateSettings({ selectedColumns: cols });
  };

  const formatValue = (value: any, colId: string) => {
    if (value === 0 || value === null || value === undefined || isNaN(value)) return '—';
    const currencyCols = [
      'spend', 'cpc', 'cpm', 'cpl', 'cost_per_result', 
      'purchase_value', 'cost_per_purchase', 'cost_per_post_engagement', 
      'cost_per_messaging_start', 'cost_per_thruplay', 'cost_per_lpv', 
      'cost_per_outbound_click', 'cost_per_page_engagement', 'cost_per_like',
      'cost_per_p3s', 'cost_per_p2s_continuous', 'cost_per_new_contact',
      'result_value'
    ];
    const percentCols = [
      'ctr_link', 'ctr_all', 'hook_rate', 'hold_rate', 
      'v25', 'v50', 'v75', 'v95', 'v100', 'conversion_rate',
      'result_rate', 'ctr_link_unique', 'spend_pct'
    ];

    if (currencyCols.includes(colId)) return `R$${value.toFixed(2)}`;
    if (percentCols.includes(colId)) return `${value.toFixed(2)}%`;
    if (colId === 'roas') return value.toFixed(2);
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  const renderMetric = (colId: string, metrics: any) => {
    switch (colId) {
      // 1. Resultados e investimento
      case 'results': return formatValue(metrics.totalResults, colId);
      case 'cost_per_result': return formatValue(metrics.cpl, colId);
      case 'roas': return formatValue(metrics.roas, colId);
      case 'result_rate': return formatValue(metrics.result_rate, colId);
      case 'result_value': return formatValue(metrics.result_value, colId);
      case 'spend': return formatValue(metrics.spend, colId);
      case 'spend_pct': return formatValue(metrics.spend_pct, colId);

      // 2. Distribuição
      case 'impressions': return formatValue(metrics.impressions, colId);
      case 'reach': return formatValue(metrics.reach, colId);
      case 'frequency': return formatValue(metrics.frequency, colId);
      case 'cpm': return formatValue(metrics.cpm, colId);
      case 'cost_per_reach': return formatValue(metrics.cost_per_reach, colId);

      // 3. Mídia
      case 'video_p3s': return formatValue(metrics.video_p3s, colId);
      case 'cost_per_p3s': return formatValue(metrics.cost_per_p3s, colId);
      case 'video_thruplay': return formatValue(metrics.video_thruplay, colId);
      case 'cost_per_thruplay': return formatValue(metrics.cost_per_thruplay, colId);
      case 'video_p2s_continuous': return formatValue(metrics.video_p2s_continuous, colId);
      case 'video_p2s_continuous_unique': return formatValue(metrics.video_p2s_continuous_unique, colId);
      case 'cost_per_p2s_continuous': return formatValue(metrics.cost_per_p2s_continuous, colId);
      case 'avg_watch_time': return formatValue(metrics.avg_watch_time, colId);

      // 4. Engajamento - Cliques
      case 'clicks': return formatValue(metrics.clicks, colId);
      case 'ctr_all': return formatValue(metrics.ctr, colId);
      case 'cpc_all': return formatValue(metrics.cpc_all, colId);
      case 'link_clicks': return formatValue(metrics.link_clicks, colId);
      case 'ctr_link': return formatValue(metrics.ctrLink, colId);
      case 'cpc': return formatValue(metrics.cpc, colId);
      case 'unique_link_clicks': return formatValue(metrics.unique_link_clicks, colId);
      case 'ctr_link_unique': return formatValue(metrics.ctr_link_unique, colId);
      case 'outbound_clicks': return formatValue(metrics.outbound_clicks, colId);
      case 'unique_outbound_clicks': return formatValue(metrics.unique_outbound_clicks, colId);
      case 'cost_per_outbound_click': return formatValue(metrics.cost_per_outbound_click, colId);

      // 5. Engajamento - Tráfego
      case 'landing_page_views': return formatValue(metrics.landing_page_views, colId);
      case 'cost_per_lpv': return formatValue(metrics.cost_per_lpv, colId);
      case 'insta_profile_visits': return formatValue(metrics.insta_profile_visits, colId);

      // 6. Engajamento - Seguidores e curtidas
      case 'page_likes': return formatValue(metrics.page_likes, colId);
      case 'insta_followers': return formatValue(metrics.insta_followers, colId);
      case 'cost_per_like': return formatValue(metrics.cost_per_like, colId);

      // 7. Engajamento - Interações
      case 'post_reactions': return formatValue(metrics.post_reactions, colId);
      case 'comments': return formatValue(metrics.comments, colId);
      case 'shares': return formatValue(metrics.shares, colId);
      case 'saves': return formatValue(metrics.saves, colId);
      case 'post_engagement': return formatValue(metrics.post_engagement, colId);
      case 'cost_per_post_engagement': return formatValue(metrics.cost_per_post_engagement, colId);
      case 'page_engagement': return formatValue(metrics.page_engagement, colId);
      case 'cost_per_page_engagement': return formatValue(metrics.cost_per_page_engagement, colId);

      // 8. Mensagens
      case 'messaging_starts': return formatValue(metrics.messaging_starts, colId);
      case 'cost_per_messaging_start': return formatValue(metrics.cost_per_messaging_start, colId);
      case 'new_messaging_contacts': return formatValue(metrics.new_messaging_contacts, colId);
      case 'cost_per_new_contact': return formatValue(metrics.cost_per_new_contact, colId);
      case 'messaging_replies': return formatValue(metrics.messaging_replies, colId);
      case 'messaging_returns': return formatValue(metrics.messaging_returns, colId);

      // 9. Conversões
      case 'leads': return formatValue(metrics.leads, colId);
      case 'cpl': return formatValue(metrics.cpl, colId);
      case 'purchases': return formatValue(metrics.purchases, colId);
      case 'purchase_value': return formatValue(metrics.purchase_value, colId);
      case 'cost_per_purchase': return formatValue(metrics.cost_per_purchase, colId);
      case 'add_to_cart': return formatValue(metrics.add_to_cart, colId);
      case 'initiate_checkout': return formatValue(metrics.initiate_checkout, colId);
      
      default: return '—';
    }
  };

  const handleExport = () => {
    if (!auditResults || selectedCampaignIds.length === 0) return;
    const campaignsToExport = auditResults.filter(c => selectedCampaignIds.includes(c.item.id));
    const account = accounts.find(a => a.id === selectedAccountId);
    
    // DUMP FORENSE TOTAL: Inclui TUDO que foi minerado, ignorando a seleção de tela
    let md = `${settings.auditPrompt || 'Analise este Dump Forense total.'}\n\n`;
    md += `# DUMP FORENSE TOTAL: ${account?.name.toUpperCase()}\n\n`;

    campaignsToExport.forEach(camp => {
      md += `## CAMPANHA: ${camp.item.name.toUpperCase()}\n`;
      AVAILABLE_COLUMNS.forEach(col => {
        const val = renderMetric(col.id, camp.metrics);
        if (val !== '—') md += `- ${col.label}: ${val}\n`;
      });

      camp.adSets.forEach(adSet => {
        md += `\n### CONJUNTO: ${adSet.item.name.toUpperCase()}\n`;
        AVAILABLE_COLUMNS.forEach(col => {
          const val = renderMetric(col.id, adSet.metrics);
          if (val !== '—') md += `- ${col.label}: ${val}\n`;
        });

        adSet.ads.forEach(ad => {
          md += `\n#### ANÚNCIO: ${ad.item.name.toUpperCase()}\n`;
          AVAILABLE_COLUMNS.forEach(col => {
            const val = renderMetric(col.id, ad.metrics);
            if (val !== '—') md += `- ${col.label}: ${val}\n`;
          });
        });
      });
      md += `\n---\n`;
    });

    setDumpContent(md);
    setShowDumpDialog(true);
  };

  const handleCopyDump = () => {
    navigator.clipboard.writeText(dumpContent);
    toast.success('DUMP COPIADO COM SUCESSO');
  };

  const isAllSelected = auditResults && auditResults.length > 0 && selectedCampaignIds.length === auditResults.length;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#e5e5e5] font-sans antialiased pb-24">
      {/* Header Premium */}
      <header className="px-10 py-5 flex items-center justify-between border-b border-[#1f1f1f] bg-[#0c0c0c]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-10">
           <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white"><span className="text-xl font-bold tracking-tighter">TS</span><span className="w-1.5 h-1.5 bg-primary rounded-full"></span></div>
              <span className="text-[9px] font-bold text-[#555] uppercase tracking-[0.4em]">Ads Intelligence</span>
           </div>
           
           <div className="flex items-center gap-4 ml-6 px-6 py-2 bg-[#121212] rounded-full border border-[#1f1f1f]">
              <span className="text-[9px] text-[#555] uppercase font-bold tracking-widest">CPL ALVO</span>
              <div className="flex items-center gap-1 text-white font-bold text-xs">
                 <span>R$</span>
                 <input type="number" value={settings.targetCpl || ''} onChange={(e) => handleUpdateSettings({ targetCpl: parseFloat(e.target.value) || 0 })} className="bg-transparent border-none w-14 outline-none focus:ring-0" placeholder="0" />
              </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger render={
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#1f1f1f] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-white transition-all">
                    <Columns className="w-3.5 h-3.5" /> Colunas
                  </button>
                } />
                <DialogContent className="bg-[#0c0c0c] border-[#1f1f1f] text-[#e5e5e5] rounded-3xl shadow-2xl sm:max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0">
                  <div className="px-8 py-6 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0c0c0c]">
                    <div>
                      <DialogTitle className="text-primary uppercase text-xs tracking-[0.2em] font-black">Gestão de Colunas</DialogTitle>
                      <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mt-1">Selecione as métricas para o seu dashboard</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {Array.from(new Set(AVAILABLE_COLUMNS.map(c => c.category))).sort().map(category => (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 whitespace-nowrap">{category}</h3>
                          <div className="h-[1px] w-full bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {AVAILABLE_COLUMNS.filter(c => c.category === category).map(col => (
                            <div 
                              key={col.id} 
                              onClick={() => toggleColumn(col.id)} 
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                                settings.selectedColumns.includes(col.id) 
                                  ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                                  : 'bg-[#111111] border-[#1f1f1f] hover:border-[#333]'
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  settings.selectedColumns.includes(col.id) 
                                    ? 'bg-primary border-primary' 
                                    : 'border-[#333] group-hover:border-[#555]'
                                }`}>
                                   {settings.selectedColumns.includes(col.id) && <Check className="w-3.5 h-3.5 text-[#0c0c0c] stroke-[3]" />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${
                                  settings.selectedColumns.includes(col.id) ? 'text-white' : 'text-[#555] group-hover:text-[#888]'
                                }`}>
                                  {col.label}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-8 py-6 border-t border-[#1f1f1f] bg-[#0c0c0c]/80 backdrop-blur-md flex justify-end">
                     <button 
                        onClick={handleSaveSettings}
                        className="bg-primary text-[#0c0c0c] font-black px-10 py-4 rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                     >
                        Aplicar Configurações
                     </button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger render={<button className="text-[#333] hover:text-primary transition-colors cursor-pointer"><SettingsIcon className="w-4 h-4" /></button>} />
                <DialogContent className="bg-[#111111] border-[#1f1f1f] text-[#e5e5e5] rounded-2xl max-w-xl">
                  <DialogHeader><DialogTitle className="text-primary uppercase text-[10px] font-bold">Estação Setup</DialogTitle></DialogHeader>
                  <div className="py-6 space-y-6">
                    <div className="space-y-1"><Label className="text-[10px] uppercase text-[#555] font-bold">Meta Token</Label><Input type="password" value={settings.metaAccessToken || ''} onChange={e => setSettings({...settings, metaAccessToken: e.target.value})} className="bg-[#0c0c0c] border-[#1f1f1f] rounded-xl" /></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase text-[#555] font-bold">Prompt IA</Label><textarea value={settings.auditPrompt || ''} onChange={e => setSettings({...settings, auditPrompt: e.target.value})} className="w-full bg-[#0c0c0c] border border-[#1f1f1f] text-xs h-32 rounded-xl p-4 resize-none outline-none focus:border-primary" /></div>
                  </div>
                  <button onClick={handleSaveSettings} className="w-full bg-primary text-[#0c0c0c] font-bold py-4 rounded-xl text-xs uppercase tracking-widest">Salvar</button>
                </DialogContent>
              </Dialog>

              <Dialog open={showDumpDialog} onOpenChange={setShowDumpDialog}>
                <DialogContent className="bg-[#0c0c0c] border-[#1f1f1f] text-[#e5e5e5] rounded-3xl shadow-2xl sm:max-w-4xl w-full max-h-[85vh] flex flex-col p-0 overflow-hidden">
                  <div className="px-8 py-6 border-b border-[#1f1f1f] flex items-center justify-between bg-[#080808]">
                    <div>
                      <DialogTitle className="text-primary uppercase text-xs tracking-[0.2em] font-black">Dump Forense Total</DialogTitle>
                      <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mt-1">Pronto para ser processado por IA</p>
                    </div>
                    <button 
                      onClick={handleCopyDump}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-[#0c0c0c] rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar para IA
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#090909]">
                    <pre className="text-[11px] font-mono leading-relaxed text-[#888] whitespace-pre-wrap break-words selection:bg-primary/20 selection:text-primary">
                      {dumpContent}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-3 bg-[#161616] pr-4 pl-1.5 py-1.5 rounded-full border border-[#1f1f1f]"><div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User className="w-3.5 h-3.5" /></div><span className="text-[10px] font-bold text-white uppercase tracking-tighter">Aragonez Vidal</span></div>
           </div>
        </div>
      </header>

      <main className="px-10 py-10 space-y-8">
        <section className="flex items-center gap-4 p-1.5 bg-[#121212] border border-[#1f1f1f] rounded-full h-16 relative shadow-2xl">
          <div className="flex-1 h-full pl-6 flex items-center" ref={dropdownRef}>
            <div className="relative w-full">
              <div onClick={() => setIsAccountOpen(!isAccountOpen)} className="flex items-center justify-between w-full cursor-pointer group">
                <div className="flex items-center gap-3 text-white"><Search className="w-4 h-4 text-[#333]" /><span className="text-[11px] font-bold uppercase tracking-tight">{selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name.toUpperCase() : 'SELECIONAR CONTA'}</span></div>
                <ChevronDown className={`w-4 h-4 text-[#333] transition-transform mr-4 ${isAccountOpen ? 'rotate-180' : ''}`} />
              </div>
              {isAccountOpen && (
                <div className="absolute top-[calc(100%+12px)] left-[-24px] w-96 bg-[#121212] border border-[#1f1f1f] rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#1f1f1f]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
                      <input 
                        type="text" 
                        placeholder="PESQUISAR CONTA..."
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                        className="w-full bg-[#080808] border border-[#1f1f1f] rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:border-primary outline-none transition-all"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-2 custom-scrollbar">
                    {isLoading && accounts.length === 0 ? (
                      <div className="px-6 py-12 flex flex-col items-center gap-3">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-[10px] font-bold text-[#333] uppercase tracking-widest">Sincronizando Contas...</span>
                      </div>
                    ) : (
                      <>
                        {accounts
                          .filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase()) || acc.id.includes(accountSearch))
                          .sort((a, b) => {
                            const aFav = favoriteAccountIds.includes(a.id);
                            const bFav = favoriteAccountIds.includes(b.id);
                            if (aFav && !bFav) return -1;
                            if (!aFav && bFav) return 1;
                            return a.name.localeCompare(b.name);
                          })
                          .map(acc => (
                            <div 
                              key={acc.id} 
                              className={`px-4 py-3 text-[10px] font-bold uppercase cursor-pointer hover:bg-[#1a1a1a] flex items-center justify-between group ${selectedAccountId === acc.id ? 'bg-primary/5' : ''}`}
                              onClick={() => { setSelectedAccount(acc.id); setIsAccountOpen(false); setAccountSearch(''); }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className={selectedAccountId === acc.id ? 'text-primary' : 'text-[#888] group-hover:text-white'}>{acc.name}</span>
                                <span className="text-[8px] text-[#333] tracking-normal font-mono">{acc.id}</span>
                              </div>
                              <div 
                                onClick={(e) => { e.stopPropagation(); toggleFavoriteAccount(acc.id); }}
                                className={`p-2 rounded-lg transition-all ${favoriteAccountIds.includes(acc.id) ? 'text-primary' : 'text-[#222] hover:text-[#444]'}`}
                              >
                                <Star className={`w-3.5 h-3.5 ${favoriteAccountIds.includes(acc.id) ? 'fill-current' : ''}`} />
                              </div>
                            </div>
                          ))}
                        {accounts.filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase()) || acc.id.includes(accountSearch)).length === 0 && (
                          <div className="px-6 py-8 text-center text-[10px] font-bold text-[#333] uppercase tracking-widest">Nenhuma conta encontrada</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="h-6 w-[1px] bg-[#1f1f1f]" />
          <div className="flex items-center gap-1 px-4">
            <DateRangePicker />
          </div>
          <div className="h-6 w-[1px] bg-[#1f1f1f]" />
          <button onClick={() => setShowActiveOnly(!showActiveOnly)} className="flex items-center gap-3 px-6"><span className="text-[10px] text-[#555] font-bold uppercase">Ativos</span><div className={`w-8 h-4 rounded-full relative ${showActiveOnly ? 'bg-primary/20' : 'bg-[#1f1f1f]'}`}><div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${showActiveOnly ? 'left-5 bg-primary shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'left-1 bg-[#333]'}`} /></div></button>
          <button onClick={handleStartAudit} disabled={isLoading || !selectedAccountId} className="bg-primary text-[#0c0c0c] font-bold h-12 px-10 rounded-full flex items-center gap-2 text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-20 shadow-xl shadow-primary/20"><Zap className="w-4 h-4 fill-current" /> Disparar</button>
        </section>

        {/* Tabela de Mineração Total */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#121212] border-b border-[#1f1f1f]">
                <tr>
                  <th className="p-4 w-12 sticky left-0 bg-[#121212] z-20">
                    <div 
                      onClick={() => toggleAllCampaigns(auditResults?.map(c => c.item.id) || [])}
                      className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all ${isAllSelected ? 'bg-primary border-primary shadow-[0_0_5px_rgba(245,158,11,0.3)]' : 'border-[#333] hover:border-[#555]'}`}
                    >
                      {isAllSelected && <Check className="w-3 h-3 text-[#0c0c0c]" />}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold text-[#555] uppercase tracking-widest sticky left-12 bg-[#121212] z-20 min-w-[300px]">NOME DO NODO</th>
                  {settings.selectedColumns.map(col => (
                    <th key={col} className="p-4 text-[10px] font-bold text-[#555] uppercase tracking-widest text-right min-w-[120px]">
                      {AVAILABLE_COLUMNS.find(c => c.id === col)?.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818]">
                {auditResults?.map(campaign => (
                  <>
                    <tr key={campaign.item.id} className="hover:bg-[#141414] group transition-colors">
                      <td className="p-4 sticky left-0 bg-[#0e0e0e] group-hover:bg-[#141414] z-10">
                        <div onClick={() => toggleCampaignSelection(campaign.item.id)} className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${selectedCampaignIds.includes(campaign.item.id) ? 'bg-primary border-primary shadow-[0_0_5px_rgba(245,158,11,0.3)]' : 'border-[#333]'}`}>
                          {selectedCampaignIds.includes(campaign.item.id) && <Check className="w-3 h-3 text-[#0c0c0c]" />}
                        </div>
                      </td>
                      <td className="p-4 sticky left-12 bg-[#0e0e0e] group-hover:bg-[#141414] z-10 border-r border-[#1f1f1f]">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedCampaigns(prev => prev.includes(campaign.item.id) ? prev.filter(i => i !== campaign.item.id) : [...prev, campaign.item.id])}>
                          <ChevronRight className={`w-4 h-4 text-[#333] transition-transform ${expandedCampaigns.includes(campaign.item.id) ? 'rotate-90' : ''}`} />
                          <div className="flex flex-col"><span className="text-[11px] font-bold text-white uppercase tracking-tight">{campaign.item.name}</span><span className="text-[7px] text-primary font-bold uppercase tracking-widest">Campanha</span></div>
                        </div>
                      </td>
                      {settings.selectedColumns.map(col => (
                        <td key={col} className="p-4 text-[11px] font-mono font-bold text-right text-[#f5f5f5]">{renderMetric(col, campaign.metrics)}</td>
                      ))}
                    </tr>

                    {expandedCampaigns.includes(campaign.item.id) && campaign.adSets.map(adSet => (
                      <>
                        <tr key={adSet.item.id} className="bg-[#0b0b0b] hover:bg-[#111111] transition-colors border-l-2 border-primary/20">
                          <td className="p-4 sticky left-0 bg-[#0b0b0b] group-hover:bg-[#111111] z-10"></td>
                          <td className="p-4 pl-12 sticky left-12 bg-[#0b0b0b] group-hover:bg-[#111111] z-10 border-r border-[#1f1f1f]">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedAdSets(prev => prev.includes(adSet.item.id) ? prev.filter(i => i !== adSet.item.id) : [...prev, adSet.item.id])}>
                               <ChevronRight className={`w-3.5 h-3.5 text-[#222] transition-transform ${expandedAdSets.includes(adSet.item.id) ? 'rotate-90' : ''}`} />
                               <div className="flex flex-col"><span className="text-[10px] font-bold text-[#888] uppercase">{adSet.item.name}</span><span className="text-[7px] text-[#333] font-bold uppercase tracking-widest mt-0.5">Conjunto</span></div>
                            </div>
                          </td>
                          {settings.selectedColumns.map(col => (
                            <td key={col} className="p-4 text-[10px] font-mono font-bold text-right text-[#888]">{renderMetric(col, adSet.metrics)}</td>
                          ))}
                        </tr>

                        {expandedAdSets.includes(adSet.item.id) && adSet.ads.map(ad => (
                          <tr key={ad.item.id} className="bg-[#090909] hover:bg-[#0e0e0e] border-l-2 border-primary/40 group">
                            <td className="p-4 sticky left-0 bg-[#090909] group-hover:bg-[#0e0e0e] z-10"></td>
                            <td className="p-4 pl-20 sticky left-12 bg-[#090909] group-hover:bg-[#0e0e0e] z-10 border-r border-[#1f1f1f]">
                               <div className="flex flex-col"><span className="text-[10px] font-bold text-[#555] uppercase">{ad.item.name}</span><span className="text-[7px] text-[#222] font-bold uppercase tracking-widest mt-0.5">Anúncio</span></div>
                            </td>
                            {settings.selectedColumns.map(col => (
                              <td key={col} className="p-4 text-[10px] font-mono font-bold text-right text-[#555]">{renderMetric(col, ad.metrics)}</td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      {auditResults && (
        <div className="fixed bottom-0 left-0 w-full border-t border-[#1f1f1f] bg-[#0c0c0c]/85 backdrop-blur-2xl p-5 z-50">
           <div className="container max-w-[1700px] flex justify-between items-center px-10 mx-auto">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] text-[#444] uppercase font-bold tracking-widest">Mineração Exaustiva Concluída</span>
                 <span className="text-sm font-bold text-white tracking-tight">{selectedCampaignIds.length} Itens em Fila para IA</span>
              </div>
              <button 
                onClick={handleExport}
                disabled={selectedCampaignIds.length === 0}
                className={`flex items-center gap-4 px-12 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${
                  selectedCampaignIds.length > 0 ? 'bg-primary text-[#0c0c0c] shadow-2xl shadow-primary/30 hover:scale-105' : 'bg-[#1a1a1a] text-[#333] opacity-30'
                }`}
              >
                <Download className="w-4 h-4" /> Gerar Dump Forense Total
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
