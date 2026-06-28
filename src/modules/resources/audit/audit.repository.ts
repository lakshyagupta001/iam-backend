import { prisma } from '../../../prisma/client';

export const auditRepository = {
  async findMany(organizationId: string) {
    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
    });
  },
};
