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
exports.groupController = void 0;
const groups_service_1 = require("./groups.service");
const groups_validation_1 = require("./groups.validation");
class GroupController {
    async createGroup(req, res) {
        const group = await groups_service_1.groupService.createGroup(req.user.orgId, req.body);
        res.status(201).json({ success: true, message: 'Group created successfully', data: group });
    }
    async listGroups(req, res) {
        const query = groups_validation_1.groupQuerySchema.parse(req.query);
        const result = await groups_service_1.groupService.listGroups(req.user.orgId, query);
        const { formatPaginatedResponse } = await Promise.resolve().then(() => __importStar(require('../../../shared/utils/pagination')));
        res.status(200).json({
            success: true,
            ...formatPaginatedResponse(result.groups, result.total, query.page || 1, query.limit || 10)
        });
    }
    async listDelegatableGroups(req, res) {
        const query = groups_validation_1.groupQuerySchema.parse(req.query);
        const result = await groups_service_1.groupService.listDelegatableGroups(req.user.orgId, req.user.id, req.user.isRoot, query);
        const { formatPaginatedResponse } = await Promise.resolve().then(() => __importStar(require('../../../shared/utils/pagination')));
        res.status(200).json({
            success: true,
            ...formatPaginatedResponse(result.groups, result.total, query.page || 1, query.limit || 10)
        });
    }
    async getGroup(req, res) {
        const group = await groups_service_1.groupService.getGroupById(req.params.id, req.user.orgId);
        const mappedGroup = {
            ...group,
            memberships: group.users,
            policyAttachments: group.policies,
        };
        res.status(200).json({ success: true, data: mappedGroup });
    }
    async updateGroup(req, res) {
        const group = await groups_service_1.groupService.updateGroup(req.params.id, req.user.orgId, req.body);
        res.status(200).json({ success: true, message: 'Group updated successfully', data: group });
    }
    async deleteGroup(req, res) {
        await groups_service_1.groupService.deleteGroup(req.params.id, req.user.orgId);
        res.status(200).json({ success: true, message: 'Group deleted successfully' });
    }
    async addMember(req, res) {
        const { userId } = req.body;
        await groups_service_1.groupService.addUserToGroup(req.params.id, userId, req.user.orgId);
        res.status(201).json({ success: true, message: 'User added to group successfully' });
    }
    async removeMember(req, res) {
        const userId = req.params.userId;
        await groups_service_1.groupService.removeUserFromGroup(req.params.id, userId, req.user.orgId);
        res.status(200).json({ success: true, message: 'User removed from group successfully' });
    }
    async attachPolicy(req, res) {
        const groupId = req.params.id;
        const { policyId } = req.body;
        await groups_service_1.groupService.attachPolicy(groupId, policyId, req.user.orgId, req.user.id);
        res.status(201).json({ success: true, message: 'Policy attached successfully' });
    }
    async detachPolicy(req, res) {
        const groupId = req.params.id;
        const policyId = req.params.policyId;
        await groups_service_1.groupService.detachPolicy(groupId, policyId, req.user.orgId);
        res.status(200).json({ success: true, message: 'Policy detached successfully' });
    }
}
exports.groupController = new GroupController();
