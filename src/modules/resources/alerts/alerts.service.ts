import { AppError } from '../../../shared/utils/AppError';
import { alertsRepository } from './alerts.repository';

export const alertsService = {
  async listAlerts(organizationId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const [totalItems, alerts] = await Promise.all([
      alertsRepository.count(organizationId, search),
      alertsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
    ]);
    return { totalItems, alerts };
  },

  async getAlert(organizationId: string, id: string) {
    const alert = await alertsRepository.findUnique(id, organizationId);

    if (!alert) {
      throw new AppError(404, 'Alert not found');
    }

    return alert;
  },

  async createAlert(organizationId: string, data: { title: string; message: string; severity: string }) {
    return alertsRepository.create({
      ...data,
      organizationId,
    });
  },

  async updateAlert(organizationId: string, id: string, data: { title?: string; message?: string; severity?: string }) {
    const alert = await alertsRepository.findUnique(id, organizationId);

    if (!alert) {
      throw new AppError(404, 'Alert not found');
    }

    return alertsRepository.update(id, data);
  },

  async deleteAlert(organizationId: string, id: string) {
    const alert = await alertsRepository.findUnique(id, organizationId);

    if (!alert) {
      throw new AppError(404, 'Alert not found');
    }

    await alertsRepository.delete(id);
  },
};
