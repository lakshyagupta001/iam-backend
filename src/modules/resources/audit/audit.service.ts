import { auditRepository } from './audit.repository';

export const auditService = {
  async listLogs(organizationId: string) {
    return auditRepository.findMany(organizationId);
  },
};
