import { auditRepository } from './audit.repository';

export const auditService = {
  async listLogs(organizationId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const [totalItems, logs] = await Promise.all([
      auditRepository.count(organizationId, search),
      auditRepository.findMany(organizationId, (page - 1) * limit, limit, search)
    ]);
    return { totalItems, logs };
  },
};
