"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = void 0;
const policies_repository_1 = require("./policies.repository");
const AppError_1 = require("../../../shared/utils/AppError");
const client_1 = require("@prisma/client");
const logger_1 = require("../../../shared/utils/logger");
const delegation_service_1 = require("../delegation/delegation.service");
class PolicyService {
    async createPolicy(organizationId, requestingUserId, data) {
        const existing = await policies_repository_1.policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
        if (existing) {
            throw new AppError_1.AppError(409, `A policy named '${data.name}' already exists`);
        }
        // DBP: requester must hold every Allow action they are trying to grant
        await delegation_service_1.delegationBypassService.validateForPolicyCreate(requestingUserId, data.name, data.statements);
        const created = await policies_repository_1.policyRepository.createPolicy(data.name, data.description, data.type, organizationId, data.statements.map(s => ({
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
        const { data: policies, total: totalItems } = await policies_repository_1.policyRepository.listPolicies(organizationId, {
            skip,
            take: limit,
            search,
            type,
            sort,
            order,
        });
        return { totalItems, policies };
    }
    async listDelegatablePolicies(organizationId, requestingUserId, isRoot, params) {
        const { page, limit, search, type, sort, order } = params;
        const skip = (page - 1) * limit;
        if (isRoot) {
            const { data: policies, total: totalItems } = await policies_repository_1.policyRepository.listPolicies(organizationId, {
                skip,
                take: limit,
                search,
                type,
                sort,
                order,
            });
            return { totalItems, policies };
        }
        // For non-root users, filter out policies they cannot delegate (DBP check)
        const { permissionService } = await Promise.resolve().then(() => __importStar(require('../evaluation/evaluation.service')));
        const effectivePerms = await permissionService.getEffectivePermissions(requestingUserId);
        const allPolicies = await policies_repository_1.policyRepository.findManyWithStatements(organizationId, { search, type });
        // Filter delegatable policies
        const delegatablePolicies = allPolicies.filter(policy => delegation_service_1.delegationBypassService.checkAllowStatementsSync(effectivePerms, policy.statements));
        // Apply sorting in memory
        const sortField = sort || 'createdAt';
        const sortOrder = order || 'desc';
        delegatablePolicies.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (valA < valB)
                return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB)
                return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        // Apply pagination in memory
        const paginatedPolicies = delegatablePolicies.slice(skip, skip + limit);
        // Remove statements before returning to match the original return type if needed
        const policies = paginatedPolicies.map(p => {
            const { statements, ...rest } = p;
            return rest;
        });
        return { totalItems: delegatablePolicies.length, policies };
    }
    async getPolicyById(id, organizationId) {
        const policy = await policies_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        return policy;
    }
    async updatePolicy(id, organizationId, requestingUserId, data) {
        const policy = await policies_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (data.name && data.name.toLowerCase() !== policy.name.toLowerCase()) {
            const existing = await policies_repository_1.policyRepository.findPolicyByNameAndOrg(data.name, organizationId);
            if (existing) {
                throw new AppError_1.AppError(409, `A policy named '${data.name}' already exists`);
            }
        }
        // DBP: only run when statements are being changed (name-only updates do not alter grants)
        if (data.statements && data.statements.length > 0) {
            await delegation_service_1.delegationBypassService.validateForPolicyUpdate(requestingUserId, id, data.name ?? policy.name, data.statements);
        }
        const statements = data.statements?.map(s => ({
            effect: s.effect,
            actions: s.actions,
            resource: s.resource || '*',
        }));
        const updated = await policies_repository_1.policyRepository.updatePolicy(id, {
            name: data.name,
            description: data.description,
        }, statements);
        logger_1.logger.info(`Policy '${updated.name}' updated`, { policyId: updated.id, organizationId });
        return updated;
    }
    async deletePolicy(id, organizationId, isRoot) {
        const policy = await policies_repository_1.policyRepository.findPolicyById(id, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type === client_1.PolicyType.MANAGED && !isRoot) {
            const { users, groups } = await policies_repository_1.policyRepository.countAttachments(id);
            if (users > 0 || groups > 0) {
                throw new AppError_1.AppError(400, `Cannot delete: still attached to ${users} users and ${groups} groups`);
            }
        }
        await policies_repository_1.policyRepository.deletePolicy(id);
        logger_1.logger.info(`Policy '${policy.name}' deleted`, { policyId: id, organizationId });
    }
}
exports.policyService = new PolicyService();
