import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const reportsRepository = {
  async findMany(organizationId: string) {
    return prisma.report.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
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
