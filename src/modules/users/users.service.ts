import { prisma } from '../../prisma/client';
import { AppError } from '../../shared/utils/AppError';
import { hashPassword } from '../../shared/utils/password';
import { z } from 'zod';
import { createUserSchema } from './users.validation';

class UsersService {
  async listUsers(orgId: string) {
    return prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(orgId: string, data: z.infer<typeof createUserSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already in use');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        isRoot: false, // User Management currently only creates Normal users
        organizationId: orgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        createdAt: true,
      },
    });

    return user;
  }

  async attachPolicy(userId: string, policyId: string, orgId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }
    if (policy.type !== 'MANAGED') {
      throw new AppError(400, 'Only MANAGED policies can be attached to users');
    }

    const existingAttachment = await prisma.userPolicyAttachment.findUnique({
      where: {
        userId_policyId: {
          userId,
          policyId,
        },
      },
    });

    if (existingAttachment) {
      throw new AppError(409, 'Policy is already attached to this user');
    }

    await prisma.userPolicyAttachment.create({
      data: {
        userId,
        policyId,
      },
    });
  }

  async detachPolicy(userId: string, policyId: string, orgId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    const existingAttachment = await prisma.userPolicyAttachment.findUnique({
      where: {
        userId_policyId: {
          userId,
          policyId,
        },
      },
    });

    if (!existingAttachment) {
      throw new AppError(404, 'Policy is not attached to this user');
    }

    await prisma.userPolicyAttachment.delete({
      where: {
        userId_policyId: {
          userId,
          policyId,
        },
      },
    });
  }
}

export const usersService = new UsersService();
