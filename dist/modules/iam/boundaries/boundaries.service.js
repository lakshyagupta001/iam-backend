"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundaryService = void 0;
const AppError_1 = require("../../../shared/utils/AppError");
const logger_1 = require("../../../shared/utils/logger");
const boundaries_repository_1 = require("./boundaries.repository");
class BoundaryService {
    async assignBoundary(targetUserId, policyId, orgId, requestingUserId) {
        const user = await boundaries_repository_1.boundariesRepository.getUserWithBoundary(targetUserId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const policy = await boundaries_repository_1.boundariesRepository.getPolicyWithStatements(policyId, orgId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Permission boundaries must be MANAGED policies');
        }
        const previousBoundaryPolicyId = user.boundary?.policyId ?? null;
        const boundary = await boundaries_repository_1.boundariesRepository.upsertBoundary(targetUserId, policyId);
        logger_1.logger.info('[Boundary] Boundary assigned', {
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
    async getBoundary(targetUserId, orgId) {
        const user = await boundaries_repository_1.boundariesRepository.getUserWithBoundary(targetUserId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const boundary = await boundaries_repository_1.boundariesRepository.findBoundary(targetUserId);
        return boundary;
    }
    async removeBoundary(targetUserId, orgId, requestingUserId) {
        const user = await boundaries_repository_1.boundariesRepository.getUserWithBoundary(targetUserId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const existing = await boundaries_repository_1.boundariesRepository.findBoundaryForRemoval(targetUserId);
        if (!existing) {
            throw new AppError_1.AppError(404, 'No boundary is currently assigned to this user');
        }
        await boundaries_repository_1.boundariesRepository.deleteBoundary(targetUserId);
        logger_1.logger.info('[Boundary] Boundary removed', {
            requestingUserId,
            targetUserId,
            targetUserName: user.name,
            removedBoundaryPolicyId: existing.policyId,
            removedBoundaryPolicyName: existing.policy.name,
            result: 'REMOVED',
        });
    }
}
exports.boundaryService = new BoundaryService();
