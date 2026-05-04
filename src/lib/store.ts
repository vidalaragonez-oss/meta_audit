import { create } from 'zustand';
import { MetaAdAccount } from './meta/types';
import { EnrichedCampaign } from './rule-engine/rule-service';

interface AuditState {
  accounts: MetaAdAccount[];
  selectedAccountId: string | null;
  startDate: string | null;
  endDate: string | null;
  datePreset: string | null;
  showActiveOnly: boolean;
  auditResults: EnrichedCampaign[] | null;
  selectedCampaignIds: string[]; // Novo: IDs das campanhas marcadas para exportação
  accountBaseline: { avgCpl: number, avgCtr: number } | null;
  isLoading: boolean;
  error: string | null;

  setAccounts: (accounts: MetaAdAccount[]) => void;
  setSelectedAccount: (id: string | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  setDatePreset: (preset: string | null) => void;
  setShowActiveOnly: (show: boolean) => void;
  setAuditResults: (data: { results: EnrichedCampaign[], baseline: any } | null) => void;
  toggleCampaignSelection: (id: string) => void;
  toggleAllCampaigns: (ids: string[]) => void;
  clearSelection: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  accounts: [],
  selectedAccountId: null,
  startDate: null,
  endDate: null,
  datePreset: 'last_14d',
  showActiveOnly: true,
  auditResults: null,
  selectedCampaignIds: [],
  accountBaseline: null,
  isLoading: false,
  error: null,

  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccount: (selectedAccountId) => set({ selectedAccountId }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate, datePreset: null, selectedCampaignIds: [] }),
  setDatePreset: (datePreset) => set({ datePreset, startDate: null, endDate: null, selectedCampaignIds: [] }),
  setShowActiveOnly: (showActiveOnly) => set({ showActiveOnly, selectedCampaignIds: [] }),
  setAuditResults: (data) => set({ 
    auditResults: data ? data.results : null, 
    accountBaseline: data ? data.baseline : null,
    selectedCampaignIds: []
  }),
  toggleCampaignSelection: (id) => set((state) => ({
    selectedCampaignIds: state.selectedCampaignIds.includes(id)
      ? state.selectedCampaignIds.filter(i => i !== id)
      : [...state.selectedCampaignIds, id]
  })),
  toggleAllCampaigns: (ids) => set((state) => ({
    selectedCampaignIds: state.selectedCampaignIds.length === ids.length ? [] : ids
  })),
  clearSelection: () => set({ selectedCampaignIds: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
