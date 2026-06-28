import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const alertsRepository = {
  async findMany(organizationId: string) {
    return prisma.alert.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findUnique(id: string, organizationId: string) {
    return prisma.alert.findUnique({
      where: { id, organizationId },
    });
  },

  async create(data: Prisma.AlertUncheckedCreateInput) {
    return prisma.alert.create({ data });
  },

  async update(id: string, data: Prisma.AlertUpdateInput) {
    return prisma.alert.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.alert.delete({
      where: { id },
    });
  },
};
