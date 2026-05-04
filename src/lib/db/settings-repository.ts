import prisma from './prisma';
import { AppSettings } from './types';

export class SettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      const created = await prisma.settings.create({
        data: { id: 'default' }
      });
      return {
        ...created,
        selectedColumns: created.selectedColumns.split(',')
      } as unknown as AppSettings;
    }

    return {
      ...settings,
      selectedColumns: settings.selectedColumns ? settings.selectedColumns.split(',') : []
    } as unknown as AppSettings;
  }

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const prismaData: any = { ...data };
    
    if (data.selectedColumns) {
      prismaData.selectedColumns = data.selectedColumns.join(',');
    }

    const updated = await prisma.settings.update({
      where: { id: 'default' },
      data: prismaData
    });

    return {
      ...updated,
      selectedColumns: updated.selectedColumns ? updated.selectedColumns.split(',') : []
    } as unknown as AppSettings;
  }
}
