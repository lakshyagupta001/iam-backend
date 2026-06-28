import { policyRepository, PolicyWithStatements } from './policy.repository';
import { CreatePolicyDto, UpdatePolicyDto } from './policy.types';
import { AppError } from '../../shared/utils/AppError';
import { PolicyType, Policy } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { delegationBypassService } from '../delegation/delegationBypass.service';

class PolicyService {
  async createPolicy(
    organizationId: string,
    requestingUserId: string,
    data: CreatePolicyDto
  ): Promise<PolicyWithStatements> {
    const existing = await policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
    if (existing) {
      throw new AppError(409, `A policy named '${data.name}' already exists`);
    }

    // DBP: requester must hold every Allow action they are trying to grant
    await delegationBypassService.validateForPolicyCreate(
      requestingUserId,
      data.name,
      data.statements
    );

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

  async listPolicies(organizationId: string, params: { page: number; limit: number; search?: string, type?: PolicyType, sort?: string, order?: 'asc' | 'desc' }) {
    const { page, limit, search, type, sort, order } = params;
    const skip = (page - 1) * limit;

    const { data: policies, total: totalItems } = await policyRepository.listPolicies(organizationId, {
      skip,
      take: limit,
      search,
      type,
      sort,
      order,
    });

    return { totalItems, policies };
  }

  async getPolicyById(id: string, organizationId: string): Promise<PolicyWithStatements> {
    const policy = await policyRepository.findPolicyById(id, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }
    return policy;
  }

  async updatePolicy(
    id: string,
    organizationId: string,
    requestingUserId: string,
    data: UpdatePolicyDto
  ): Promise<PolicyWithStatements> {
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

    // DBP: only run when statements are being changed (name-only updates do not alter grants)
    if (data.statements && data.statements.length > 0) {
      await delegationBypassService.validateForPolicyUpdate(
        requestingUserId,
        id,
        data.name ?? policy.name,
        data.statements
      );
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
