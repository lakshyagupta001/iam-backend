import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const settingsRepository = {
  async findMany(organizationId: string) {
    return prisma.setting.findMany({
      where: { organizationId },
      orderBy: { key: 'asc' },
    });
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
