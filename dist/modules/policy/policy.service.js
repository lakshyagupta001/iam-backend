"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = void 0;
const policy_repository_1 = require("./policy.repository");
const AppError_1 = require("../../shared/utils/AppError");
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
const delegationBypass_service_1 = require("../delegation/delegationBypass.service");
class PolicyService {
    async createPolicy(organizationId, requestingUserId, data) {
        const existing = await policy_repository_1.policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
        if (existing) {
            throw new AppError_1.AppError(409, `A policy named '${data.name}' already exists`);
        }
        // DBP: requester must hold every Allow action they are trying to grant
        await delegationBypass_service_1.delegationBypassService.validateForPolicyCreate(requestingUserId, data.name, data.statements);
        const created = await policy_repository_1.policyRepository.createPolicy(data.name, data.description, data.type, organizationId, data.statements.map(s => ({
            effect: s.effect,
            actions: s.actions,
            resource: s.resource || '*',
        })));
        logger_1.logger.info(`Policy '${data.name}' created`, { policyId: created.id, organizationId });
        return created;
    }
    async listPolicies(organizationId, params) {
        const { page, limit, search, type, sort, order } = params;
        const skip = (page - 1) * limit;
        const { data: policies, total: totalItems } = await policy_repository_1.policyRepository.listPolicies(organizationId, {
            skip,
            take: limit,
            search,
            type,
            sort,
            order,
        });
        return { totalItems, policies };
    }
    async getPolicyById(id, organizationId) {
        const policy = await policy_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        return policy;
    }
    async updatePolicy(id, organizationId, requestingUserId, data) {
        const policy = await policy_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (data.name && data.name.toLowerCase() !== policy.name.toLowerCase()) {
            const existing = await policy_repository_1.policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
            if (existing) {
                throw new AppError_1.AppError(409, `A policy named '${data.name}' already exists`);
            }
        }
        // DBP: only run when statements are being changed (name-only updates do not alter grants)
        if (data.statements && data.statements.length > 0) {
            await delegationBypass_service_1.delegationBypassService.validateForPolicyUpdate(requestingUserId, id, data.name ?? policy.name, data.statements);
        }
        const statements = data.statements?.map(s => ({
            effect: s.effect,
            actions: s.actions,
            resource: s.resource || '*',
        }));
        const updated = await policy_repository_1.policyRepository.updatePolicy(id, {
            name: data.name,
            description: data.description,
        }, statements);
        logger_1.logger.info(`Policy '${updated.name}' updated`, { policyId: updated.id, organizationId });
        return updated;
    }
    async deletePolicy(id, organizationId, isRoot) {
        const policy = await policy_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type === client_1.PolicyType.MANAGED && !isRoot) {
            const { users, groups } = await policy_repository_1.policyRepository.countAttachments(id);
            if (users > 0 || groups > 0) {
                throw new AppError_1.AppError(400, `Cannot delete: still attached to ${users} users and ${groups} groups`);
            }
        }
        await policy_repository_1.policyRepository.deletePolicy(id);
        logger_1.logger.info(`Policy '${policy.name}' deleted`, { policyId: id, organizationId });
    }
}
exports.policyService = new PolicyService();
