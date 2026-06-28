import { prisma } from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export class UsersRepository {
  async countUsers(whereClause: Prisma.UserWhereInput) {
    return prisma.user.count({ where: whereClause });
  }

  async findManyUsers(whereClause: Prisma.UserWhereInput, skip: number, take: number) {
    return prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
      },
    });
  }

  async findUserByIdWithPolicies(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: orgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
        groups: {
          include: {
            group: {
              include: {
                policies: {
                  include: {
                    policy: true,
                  },
                },
              },
            },
          },
        },
        policies: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  async findUserById(userId: string, orgId: string) {
    return prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
  }

  async findPolicyById(policyId: string, orgId: string) {
    return prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });
  }

  async findPolicyAttachment(userId: string, policyId: string) {
    return prisma.userPolicyAttachment.findUnique({
      where: {
        userId_policyId: {
          userId,
          policyId,
        },
      },
    });
  }

  async createPolicyAttachment(userId: string, policyId: string) {
    return prisma.userPolicyAttachment.create({
      data: {
        userId,
        policyId,
      },
    });
  }

  async deletePolicyAttachment(userId: string, policyId: string) {
    return prisma.userPolicyAttachment.delete({
      where: {
        userId_policyId: {
          userId,
          policyId,
        },
      },
    });
  }
}

export const usersRepository = new UsersRepository();
