import { AppError } from '../../../shared/utils/AppError';
import { settingsRepository } from './settings.repository';

export const settingsService = {
  async listSettings(organizationId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const [totalItems, settings] = await Promise.all([
      settingsRepository.count(organizationId, search),
      settingsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
    ]);
    return { totalItems, settings };
  },

  async updateSetting(organizationId: string, data: { key: string; value: string }) {
    const { key, value } = data;

    return settingsRepository.upsert(organizationId, key, value);
  },
};
