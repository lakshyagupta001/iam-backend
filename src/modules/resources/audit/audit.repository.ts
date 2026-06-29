import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const auditRepository = {
  async findById(organizationId: string, id: string) {
    return prisma.auditLog.findFirst({
      where: { id, organizationId }
    });
  },

  async findMany(organizationId: string, skip: number, take: number, search?: string) {
    const whereClause: Prisma.AuditLogWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { performedBy: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });
  },

  async count(organizationId: string, search?: string) {
    const whereClause: Prisma.AuditLogWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { performedBy: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.auditLog.count({ where: whereClause });
  },
};
