import { AppError } from '../../../shared/utils/AppError';
import { hashPassword } from '../../../shared/utils/password';
import { z } from 'zod';
import { createUserSchema } from './users.validation';
import { delegationBypassService } from '../delegation/delegation.service';
import { usersRepository } from './users.repository';

class UsersService {
  async listUsers(orgId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    
    const whereClause: any = { organizationId: orgId };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalItems, users] = await Promise.all([
      usersRepository.countUsers(whereClause),
      usersRepository.findManyUsers(whereClause, (page - 1) * limit, limit)
    ]);

    return { totalItems, users };
  }

  async createUser(orgId: string, data: z.infer<typeof createUserSchema>) {
    const existingUser = await usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(409, 'Email already in use');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await usersRepository.createUser({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      isRoot: false,
      organizationId: orgId,
    });

    return user;
  }

  async getUserById(userId: string, orgId: string) {
    const user = await usersRepository.findUserByIdWithPolicies(userId, orgId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      ...user,
      groupMemberships: user.groups,
      directPolicies: user.policies,
    };
  }

  async attachPolicy(
    userId: string,
    policyId: string,
    orgId: string,
    requestingUserId: string
  ): Promise<void> {
    const user = await usersRepository.findUserById(userId, orgId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const policy = await usersRepository.findPolicyById(policyId, orgId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }
    if (policy.type !== 'MANAGED') {
      throw new AppError(400, 'Only MANAGED policies can be attached to users');
    }

    const existingAttachment = await usersRepository.findPolicyAttachment(userId, policyId);

    if (existingAttachment) {
      throw new AppError(409, 'Policy is already attached to this user');
    }

    await delegationBypassService.validateForUserPolicyAttachment(
      requestingUserId,
      policyId,
      orgId
    );

    await usersRepository.createPolicyAttachment(userId, policyId);
  }

  async detachPolicy(userId: string, policyId: string, orgId: string): Promise<void> {
    const user = await usersRepository.findUserById(userId, orgId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const policy = await usersRepository.findPolicyById(policyId, orgId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    const existingAttachment = await usersRepository.findPolicyAttachment(userId, policyId);

    if (!existingAttachment) {
      throw new AppError(404, 'Policy is not attached to this user');
    }

    await usersRepository.deletePolicyAttachment(userId, policyId);
  }
}

export const usersService = new UsersService();
