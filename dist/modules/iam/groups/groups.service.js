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
exports.groupService = exports.GroupService = void 0;
const groups_repository_1 = require("./groups.repository");
const AppError_1 = require("../../../shared/utils/AppError");
const delegation_service_1 = require("../delegation/delegation.service");
class GroupService {
    async createGroup(organizationId, data) {
        const existingGroup = await groups_repository_1.groupRepository.findGroupByNameAndOrg(data.name, organizationId);
        if (existingGroup) {
            throw new AppError_1.AppError(409, 'A group with this name already exists');
        }
        return groups_repository_1.groupRepository.createGroup({
            name: data.name,
            description: data.description,
            organizationId,
        });
    }
    async listGroups(organizationId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const [groups, total] = await groups_repository_1.groupRepository.findGroups(organizationId, skip, limit, query.search, query.sort, query.order);
        return { groups, total };
    }
    async listDelegatableGroups(organizationId, requestingUserId, isRoot, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        if (isRoot) {
            const [groups, total] = await groups_repository_1.groupRepository.findGroups(organizationId, skip, limit, query.search, query.sort, query.order);
            return { groups, total };
        }
        // For non-root users, filter out groups they cannot delegate (DBP check on attached policies)
        const { permissionService } = await Promise.resolve().then(() => __importStar(require('../evaluation/evaluation.service')));
        const effectivePerms = await permissionService.getEffectivePermissions(requestingUserId);
        const allGroups = await groups_repository_1.groupRepository.findAllGroupsWithPoliciesAndStatements(organizationId, query.search);
        // Filter delegatable groups: a group is delegatable only if ALL its attached
        // policies contain only ALLOW actions the requesting user already holds.
        // This mirrors the Delegation Bypass Prevention invariant exactly.
        const delegatableGroups = allGroups.filter(group => {
            for (const attachment of group.policies) {
                if (!delegation_service_1.delegationBypassService.checkAllowStatementsSync(effectivePerms, attachment.policy.statements)) {
                    return false;
                }
            }
            return true;
        });
        // Apply sorting in memory
        const sortField = query.sort || 'createdAt';
        const sortOrder = query.order || 'desc';
        delegatableGroups.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (valA < valB)
                return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB)
                return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        // Apply pagination in memory
        const paginatedGroups = delegatableGroups.slice(skip, skip + limit);
        // Remove policies and statements before returning to match the original return type
        const groups = paginatedGroups.map(g => {
            const { policies, ...rest } = g;
            return rest;
        });
        return { groups, total: delegatableGroups.length };
    }
    async getGroupById(id, organizationId) {
        const group = await groups_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        return group;
    }
    async updateGroup(id, organizationId, data) {
        const group = await groups_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        if (data.name && data.name.toLowerCase() !== group.name.toLowerCase()) {
            const existingGroup = await groups_repository_1.groupRepository.findGroupByNameAndOrg(data.name, organizationId);
            if (existingGroup) {
                throw new AppError_1.AppError(409, 'A group with this name already exists');
            }
        }
        return groups_repository_1.groupRepository.updateGroup(id, data);
    }
    async deleteGroup(id, organizationId) {
        const group = await groups_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        await groups_repository_1.groupRepository.deleteGroup(id);
    }
    async addUserToGroup(groupId, userId, organizationId) {
        const group = await groups_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const userExists = await groups_repository_1.groupRepository.checkUserInOrg(userId, organizationId);
        if (!userExists) {
            throw new AppError_1.AppError(404, 'User not found in this organization');
        }
        const isMember = await groups_repository_1.groupRepository.checkMembership(userId, groupId);
        if (isMember) {
            throw new AppError_1.AppError(409, 'User is already a member of this group');
        }
        await groups_repository_1.groupRepository.addMember(userId, groupId);
    }
    async removeUserFromGroup(groupId, userId, organizationId) {
        const group = await groups_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const isMember = await groups_repository_1.groupRepository.checkMembership(userId, groupId);
        if (!isMember) {
            throw new AppError_1.AppError(404, 'User is not a member of this group');
        }
        await groups_repository_1.groupRepository.removeMember(userId, groupId);
    }
    async attachPolicy(groupId, policyId, organizationId, requestingUserId) {
        const group = await groups_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const policy = await groups_repository_1.groupRepository.checkPolicy(policyId, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Only MANAGED policies can be attached to groups');
        }
        const isAttached = await groups_repository_1.groupRepository.checkPolicyAttachment(groupId, policyId);
        if (isAttached) {
            throw new AppError_1.AppError(409, 'Policy is already attached to this group');
        }
        // DBP: requester must hold every Allow action in the policy being attached
        await delegation_service_1.delegationBypassService.validateForGroupPolicyAttachment(requestingUserId, policyId, organizationId);
        await groups_repository_1.groupRepository.attachPolicy(groupId, policyId);
    }
    async detachPolicy(groupId, policyId, organizationId) {
        const group = await groups_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const policy = await groups_repository_1.groupRepository.checkPolicy(policyId, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        const isAttached = await groups_repository_1.groupRepository.checkPolicyAttachment(groupId, policyId);
        if (!isAttached) {
            throw new AppError_1.AppError(404, 'Policy is not attached to this group');
        }
        await groups_repository_1.groupRepository.detachPolicy(groupId, policyId);
    }
}
exports.GroupService = GroupService;
exports.groupService = new GroupService();
