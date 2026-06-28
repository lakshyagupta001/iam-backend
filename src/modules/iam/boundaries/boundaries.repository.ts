import { prisma } from '../../../prisma/client';

export class BoundariesRepository {
  async getUserWithBoundary(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
      select: { id: true, name: true, boundary: { select: { policyId: true } } },
    });
  }

  async getPolicyWithStatements(policyId: string, orgId: string) {
    return prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
      include: { statements: true },
    });
  }

  async upsertBoundary(userId: string, policyId: string) {
    return prisma.userBoundary.upsert({
      where: { userId },
      create: { userId, policyId },
      update: { policyId },
      include: {
        policy: {
          include: { statements: true },
        },
      },
    });
  }

  async findBoundary(userId: string) {
    return prisma.userBoundary.findUnique({
      where: { userId },
      include: {
        policy: {
          include: { statements: true },
        },
      },
    });
  }

  async findBoundaryForRemoval(userId: string) {
    return prisma.userBoundary.findUnique({
      where: { userId },
      include: { policy: { select: { id: true, name: true } } },
    });
  }

  async deleteBoundary(userId: string) {
    return prisma.userBoundary.delete({
      where: { userId },
    });
  }
}

export const boundariesRepository = new BoundariesRepository();
