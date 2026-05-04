'use server';

import { SettingsRepository } from '@/lib/db/settings-repository';
import { AppSettings } from '@/lib/db/types';
import { MetaIntegrationService, MetaTimeRange } from '@/lib/meta/meta-service';
import { RuleEngineService } from '@/lib/rule-engine/rule-service';

export async function startAudit(accountId: string, datePreset?: string | null, timeRange?: MetaTimeRange | null, onlyActive?: boolean) {
  try {
    const settingsRepo = new SettingsRepository();
    const settings = await settingsRepo.getSettings();

    const token = process.env.META_ACCESS_TOKEN || settings.metaAccessToken;
    if (!token) {
      return { success: false, error: 'Token do Meta Ads não configurado.' };
    }

    const metaService = new MetaIntegrationService(token);
    const ruleService = new RuleEngineService();

    const tree = await metaService.getAuditTree(
      accountId, 
      datePreset || undefined, 
      (timeRange?.since && timeRange?.until) ? timeRange : undefined,
      onlyActive
    );
    
    // Passamos o targetCpl das configurações para o processamento das regras
    const { results, baseline } = ruleService.processAuditTree(tree, settings.targetCpl);

    return { 
      success: true, 
      data: { results, baseline }
    };

  } catch (error: any) {
    console.error('Audit Error:', error);
    return { 
      success: false, 
      error: error.message || 'Falha ao processar auditoria.' 
    };
  }
}

export async function getAccounts() {
  try {
    const settingsRepo = new SettingsRepository();
    const settings = await settingsRepo.getSettings();

    const token = process.env.META_ACCESS_TOKEN || settings.metaAccessToken;
    if (!token) {
      return { success: false, error: 'Token do Meta Ads não configurado.' };
    }

    const metaService = new MetaIntegrationService(token);
    const accounts = await metaService.getAdAccounts();

    return { success: true, data: accounts };
  } catch (error: any) {
    console.error('Get Accounts Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getSettingsAction() {
  try {
    const settingsRepo = new SettingsRepository();
    const settings = await settingsRepo.getSettings();
    
    // Se houver token na env, sobrepõe para o frontend saber que pode carregar
    if (process.env.META_ACCESS_TOKEN) {
      settings.metaAccessToken = process.env.META_ACCESS_TOKEN;
    }
    
    return { success: true, data: settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSettingsAction(data: Partial<AppSettings>) {
  try {
    const settingsRepo = new SettingsRepository();
    await settingsRepo.updateSettings(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
