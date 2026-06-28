"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = exports.GroupService = void 0;
const group_repository_1 = require("./group.repository");
const AppError_1 = require("../../shared/utils/AppError");
class GroupService {
    async createGroup(organizationId, data) {
        const existingGroup = await group_repository_1.groupRepository.findGroupByNameAndOrg(data.name, organizationId);
        if (existingGroup) {
            throw new AppError_1.AppError(409, 'A group with this name already exists');
        }
        return group_repository_1.groupRepository.createGroup({
            name: data.name,
            description: data.description,
            organizationId,
        });
    }
    async listGroups(organizationId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const [groups, total] = await group_repository_1.groupRepository.findGroups(organizationId, skip, limit, query.search, query.sort, query.order);
        return { groups, total };
    }
    async getGroupById(id, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        return group;
    }
    async updateGroup(id, organizationId, data) {
        const group = await group_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        if (data.name && data.name.toLowerCase() !== group.name.toLowerCase()) {
            const existingGroup = await group_repository_1.groupRepository.findGroupByNameAndOrg(data.name, organizationId);
            if (existingGroup) {
                throw new AppError_1.AppError(409, 'A group with this name already exists');
            }
        }
        return group_repository_1.groupRepository.updateGroup(id, data);
    }
    async deleteGroup(id, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(id, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        await group_repository_1.groupRepository.deleteGroup(id);
    }
    async addUserToGroup(groupId, userId, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const userExists = await group_repository_1.groupRepository.checkUserInOrg(userId, organizationId);
        if (!userExists) {
            throw new AppError_1.AppError(404, 'User not found in this organization');
        }
        const isMember = await group_repository_1.groupRepository.checkMembership(userId, groupId);
        if (isMember) {
            throw new AppError_1.AppError(409, 'User is already a member of this group');
        }
        await group_repository_1.groupRepository.addMember(userId, groupId);
    }
    async removeUserFromGroup(groupId, userId, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const isMember = await group_repository_1.groupRepository.checkMembership(userId, groupId);
        if (!isMember) {
            throw new AppError_1.AppError(404, 'User is not a member of this group');
        }
        await group_repository_1.groupRepository.removeMember(userId, groupId);
    }
    async attachPolicy(groupId, policyId, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const policy = await group_repository_1.groupRepository.checkPolicy(policyId, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Only MANAGED policies can be attached to groups');
        }
        const isAttached = await group_repository_1.groupRepository.checkPolicyAttachment(groupId, policyId);
        if (isAttached) {
            throw new AppError_1.AppError(409, 'Policy is already attached to this group');
        }
        await group_repository_1.groupRepository.attachPolicy(groupId, policyId);
    }
    async detachPolicy(groupId, policyId, organizationId) {
        const group = await group_repository_1.groupRepository.findGroupById(groupId, organizationId);
        if (!group) {
            throw new AppError_1.AppError(404, 'Group not found');
        }
        const policy = await group_repository_1.groupRepository.checkPolicy(policyId, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        const isAttached = await group_repository_1.groupRepository.checkPolicyAttachment(groupId, policyId);
        if (!isAttached) {
            throw new AppError_1.AppError(404, 'Policy is not attached to this group');
        }
        await group_repository_1.groupRepository.detachPolicy(groupId, policyId);
    }
}
exports.GroupService = GroupService;
exports.groupService = new GroupService();
