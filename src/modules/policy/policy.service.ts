import { policyRepository, PolicyWithStatements } from './policy.repository';
import { CreatePolicyDto, UpdatePolicyDto } from './policy.types';
import { AppError } from '../../shared/utils/AppError';
import { PolicyType, Policy } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

class PolicyService {
  async createPolicy(organizationId: string, data: CreatePolicyDto): Promise<PolicyWithStatements> {
    const existing = await policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
    if (existing) {
      throw new AppError(409, `A policy named '${data.name}' already exists`);
    }

    const created = await policyRepository.createPolicy(
      data.name,
      data.description,
      data.type,
      organizationId,
      data.statements.map(s => ({
        effect: s.effect,
        actions: s.actions,
        resource: s.resource || '*',
      }))
    );

    logger.info(`Policy '${data.name}' created`, { policyId: created.id, organizationId });
    return created;
  }

  async listPolicies(organizationId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const { data, total } = await policyRepository.listPolicies(organizationId, {
      skip,
      take: limit,
      search: query.search,
      type: query.type,
      sort: query.sort,
      order: query.order,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPolicyById(id: string, organizationId: string): Promise<PolicyWithStatements> {
    const policy = await policyRepository.findPolicyById(id, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }
    return policy;
  }

  async updatePolicy(id: string, organizationId: string, data: UpdatePolicyDto): Promise<PolicyWithStatements> {
    const policy = await policyRepository.findPolicyById(id, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    if (data.name && data.name.toLowerCase() !== policy.name.toLowerCase()) {
      const existing = await policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
      if (existing) {
        throw new AppError(409, `A policy named '${data.name}' already exists`);
      }
    }

    const statements = data.statements?.map(s => ({
      effect: s.effect,
      actions: s.actions,
      resource: s.resource || '*',
    }));

    const updated = await policyRepository.updatePolicy(
      id,
      {
        name: data.name,
        description: data.description,
      },
      statements
    );

    logger.info(`Policy '${updated.name}' updated`, { policyId: updated.id, organizationId });
    return updated;
  }

  async deletePolicy(id: string, organizationId: string, isRoot: boolean): Promise<void> {
    const policy = await policyRepository.findPolicyById(id, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    if (policy.type === PolicyType.MANAGED && !isRoot) {
      const { users, groups } = await policyRepository.countAttachments(id);
      if (users > 0 || groups > 0) {
        throw new AppError(400, `Cannot delete: still attached to ${users} users and ${groups} groups`);
      }
    }

    await policyRepository.deletePolicy(id);
    logger.info(`Policy '${policy.name}' deleted`, { policyId: id, organizationId });
  }
}

export const policyService = new PolicyService();
