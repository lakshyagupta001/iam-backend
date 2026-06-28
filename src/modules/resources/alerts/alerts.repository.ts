import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const alertsRepository = {
  async findMany(organizationId: string, skip: number, take: number, search?: string) {
    const whereClause: Prisma.AlertWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { severity: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  async count(organizationId: string, search?: string) {
    const whereClause: Prisma.AlertWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { severity: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.alert.count({ where: whereClause });
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
