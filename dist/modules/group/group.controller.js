"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupController = void 0;
const group_service_1 = require("./group.service");
const group_validation_1 = require("./group.validation");
class GroupController {
    async createGroup(req, res) {
        const group = await group_service_1.groupService.createGroup(req.user.orgId, req.body);
        res.status(201).json({ success: true, message: 'Group created successfully', data: group });
    }
    async listGroups(req, res) {
        // Validate query string
        const query = group_validation_1.groupQuerySchema.parse(req.query);
        const result = await group_service_1.groupService.listGroups(req.user.orgId, query);
        const { formatPaginatedResponse } = require('../../shared/utils/pagination');
        res.status(200).json({
            success: true,
            ...formatPaginatedResponse(result.groups, result.total, query.page || 1, query.limit || 10)
        });
    }
    async getGroup(req, res) {
        const group = await group_service_1.groupService.getGroupById(req.params.id, req.user.orgId);
        // Map to the format the frontend expects
        const mappedGroup = {
            ...group,
            memberships: group.users,
            policyAttachments: group.policies,
        };
        res.status(200).json({ success: true, data: mappedGroup });
    }
    async updateGroup(req, res) {
        const group = await group_service_1.groupService.updateGroup(req.params.id, req.user.orgId, req.body);
        res.status(200).json({ success: true, message: 'Group updated successfully', data: group });
    }
    async deleteGroup(req, res) {
        await group_service_1.groupService.deleteGroup(req.params.id, req.user.orgId);
        res.status(200).json({ success: true, message: 'Group deleted successfully' });
    }
    async addMember(req, res) {
        const { userId } = req.body;
        await group_service_1.groupService.addUserToGroup(req.params.id, userId, req.user.orgId);
        res.status(201).json({ success: true, message: 'User added to group successfully' });
    }
    async removeMember(req, res) {
        const userId = req.params.userId;
        await group_service_1.groupService.removeUserFromGroup(req.params.id, userId, req.user.orgId);
        res.status(200).json({ success: true, message: 'User removed from group successfully' });
    }
    async attachPolicy(req, res) {
        const groupId = req.params.id;
        const { policyId } = req.body;
        await group_service_1.groupService.attachPolicy(groupId, policyId, req.user.orgId, req.user.id);
        res.status(201).json({ success: true, message: 'Policy attached successfully' });
    }
    async detachPolicy(req, res) {
        const groupId = req.params.id;
        const policyId = req.params.policyId;
        await group_service_1.groupService.detachPolicy(groupId, policyId, req.user.orgId);
        res.status(200).json({ success: true, message: 'Policy detached successfully' });
    }
}
exports.groupController = new GroupController();
