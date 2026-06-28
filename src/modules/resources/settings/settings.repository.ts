import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const settingsRepository = {
  async findMany(organizationId: string, skip: number, take: number, search?: string) {
    const whereClause: Prisma.SettingWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.setting.findMany({
      where: whereClause,
      orderBy: { key: 'asc' },
      skip,
      take,
    });
  },

  async count(organizationId: string, search?: string) {
    const whereClause: Prisma.SettingWhereInput = { organizationId };
    if (search) {
      whereClause.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.setting.count({ where: whereClause });
  },

  async findByKey(key: string, organizationId: string) {
    return prisma.setting.findUnique({
      where: {
        key_organizationId: {
          organizationId,
          key,
        },
      },
    });
  },

  async upsert(organizationId: string, key: string, value: string) {
    return prisma.setting.upsert({
      where: {
        key_organizationId: {
          organizationId,
          key,
        },
      },
      update: { value },
      create: {
        organizationId,
        key,
        value,
      },
    });
  },
};
