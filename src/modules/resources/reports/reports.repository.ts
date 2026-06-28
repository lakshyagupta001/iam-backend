import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const reportsRepository = {
  async findMany(organizationId: string, skip: number, take: number, search?: string) {
    const whereClause: Prisma.ReportWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.report.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  async count(organizationId: string, search?: string) {
    const whereClause: Prisma.ReportWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.report.count({ where: whereClause });
  },

  async findUnique(id: string, organizationId: string) {
    return prisma.report.findUnique({
      where: { id, organizationId },
    });
  },

  async create(data: Prisma.ReportUncheckedCreateInput) {
    return prisma.report.create({ data });
  },

  async update(id: string, data: Prisma.ReportUpdateInput) {
    return prisma.report.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.report.delete({
      where: { id },
    });
  },
};
