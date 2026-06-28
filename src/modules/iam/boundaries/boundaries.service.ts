import { AppError } from '../../../shared/utils/AppError';
import { logger } from '../../../shared/utils/logger';
import { boundariesRepository } from './boundaries.repository';
import { BoundaryAssignment } from './boundaries.types';

class BoundaryService {
  async assignBoundary(
    targetUserId: string,
    policyId: string,
    orgId: string,
    requestingUserId: string
  ): Promise<BoundaryAssignment> {
    const user = await boundariesRepository.getUserWithBoundary(targetUserId, orgId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const policy = await boundariesRepository.getPolicyWithStatements(policyId, orgId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    if (policy.type !== 'MANAGED') {
      throw new AppError(400, 'Permission boundaries must be MANAGED policies');
    }

    const previousBoundaryPolicyId = user.boundary?.policyId ?? null;

    const boundary = await boundariesRepository.upsertBoundary(targetUserId, policyId);

    logger.info('[Boundary] Boundary assigned', {
      requestingUserId,
      targetUserId,
      targetUserName: user.name,
      newBoundaryPolicyId: policyId,
      newBoundaryPolicyName: policy.name,
      previousBoundaryPolicyId,
      result: previousBoundaryPolicyId ? 'REPLACED' : 'ASSIGNED',
    });

    return boundary;
  }

  async getBoundary(targetUserId: string, orgId: string): Promise<BoundaryAssignment | null> {
    const user = await boundariesRepository.getUserWithBoundary(targetUserId, orgId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const boundary = await boundariesRepository.findBoundary(targetUserId);
    return boundary;
  }

  async removeBoundary(
    targetUserId: string,
    orgId: string,
    requestingUserId: string
  ): Promise<void> {
    const user = await boundariesRepository.getUserWithBoundary(targetUserId, orgId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const existing = await boundariesRepository.findBoundaryForRemoval(targetUserId);
    if (!existing) {
      throw new AppError(404, 'No boundary is currently assigned to this user');
    }

    await boundariesRepository.deleteBoundary(targetUserId);

    logger.info('[Boundary] Boundary removed', {
      requestingUserId,
      targetUserId,
      targetUserName: user.name,
      removedBoundaryPolicyId: existing.policyId,
      removedBoundaryPolicyName: existing.policy.name,
      result: 'REMOVED',
    });
  }
}

export const boundaryService = new BoundaryService();
