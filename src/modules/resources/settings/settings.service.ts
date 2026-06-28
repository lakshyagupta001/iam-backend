import { AppError } from '../../../shared/utils/AppError';
import { settingsRepository } from './settings.repository';

export const settingsService = {
  async listSettings(organizationId: string) {
    return settingsRepository.findMany(organizationId);
  },

  async updateSetting(organizationId: string, data: { key: string; value: string }) {
    const { key, value } = data;

    return settingsRepository.upsert(organizationId, key, value);
  },
};
