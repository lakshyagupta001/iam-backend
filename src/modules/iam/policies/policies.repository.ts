import { prisma } from '../../../prisma/client';
import { Policy, PolicyType, PolicyStatement } from '@prisma/client';

export type PolicyWithStatements = Policy & { statements: PolicyStatement[] };

class PolicyRepository {
  async findPolicyByNameAndOrg(name: string, organizationId: string): Promise<PolicyWithStatements | null> {
    return prisma.policy.findFirst({
      where: {
        organizationId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        statements: true,
      },
    });
  }

  async findPolicyById(id: string, organizationId: string): Promise<PolicyWithStatements | null> {
    return prisma.policy.findFirst({
      where: { id, organizationId },
      include: {
        statements: true,
      },
    });
  }

  async createPolicy(
    name: string,
    description: string | undefined,
    type: PolicyType,
    organizationId: string,
    statements: Omit<PolicyStatement, 'id' | 'policyId'>[]
  ): Promise<PolicyWithStatements> {
    return prisma.policy.create({
      data: {
        name,
        description,
        type,
        organizationId,
        statements: {
          create: statements,
        },
      },
      include: {
        statements: true,
      },
    });
  }

  async updatePolicy(
    id: string,
    data: { name?: string; description?: string },
    statements?: Omit<PolicyStatement, 'id' | 'policyId'>[]
  ): Promise<PolicyWithStatements> {
    return prisma.policy.update({
      where: { id },
      data: {
        ...data,
        ...(statements
          ? {
              statements: {
                deleteMany: {},
                create: statements,
              },
            }
          : {}),
      },
      include: {
        statements: true,
      },
    });
  }

  async deletePolicy(id: string): Promise<void> {
    await prisma.policy.delete({
      where: { id },
    });
  }

  async listPolicies(
    organizationId: string,
    params: {
      skip?: number;
      take?: number;
      search?: string;
      type?: PolicyType;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<{ data: Policy[]; total: number }> {
    const where: any = { organizationId };

    if (params.search) {
      where.name = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    if (params.type) {
      where.type = params.type;
    }

    const orderBy: any = params.sort
      ? { [params.sort]: params.order || 'asc' }
      : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
      }),
      prisma.policy.count({ where }),
    ]);

    return { data, total };
  }

  async findManyWithStatements(
    organizationId: string,
    params: {
      search?: string;
      type?: PolicyType;
    }
  ): Promise<PolicyWithStatements[]> {
    const where: any = { organizationId };

    if (params.search) {
      where.name = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    if (params.type) {
      where.type = params.type;
    }

    return prisma.policy.findMany({
      where,
      include: {
        statements: true,
      },
    });
  }

  async countAttachments(policyId: string): Promise<{ users: number; groups: number }> {
    const [users, groups] = await Promise.all([
      prisma.userPolicyAttachment.count({ where: { policyId } }),
      prisma.groupPolicyAttachment.count({ where: { policyId } })
    ]);
    return { users, groups };
  }
}

export const policyRepository = new PolicyRepository();
