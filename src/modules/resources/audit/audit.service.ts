import { auditRepository } from './audit.repository';
import { AppError } from '../../../shared/utils/AppError';

export const auditService = {
  async listLogs(organizationId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const [totalItems, logs] = await Promise.all([
      auditRepository.count(organizationId, search),
      auditRepository.findMany(organizationId, (page - 1) * limit, limit, search)
    ]);
    return { totalItems, logs };
  },

  async getLogById(organizationId: string, id: string) {
    const log = await auditRepository.findById(organizationId, id);
    if (!log) {
      throw new AppError(404, 'Audit log not found');
    }
    return log;
  }
};
