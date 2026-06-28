"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyController = void 0;
const policy_service_1 = require("./policy.service");
const pagination_1 = require("../../shared/utils/pagination");
class PolicyController {
    async createPolicy(req, res) {
        const policy = await policy_service_1.policyService.createPolicy(req.user.orgId, req.body);
        res.status(201).json({ success: true, message: 'Policy created successfully', data: policy });
    }
    async listPolicies(req, res) {
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const type = req.query.type;
        const sort = req.query.sort;
        const order = req.query.order;
        const { totalItems, policies } = await policy_service_1.policyService.listPolicies(req.user.orgId, { ...params, type, sort, order });
        res.status(200).json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(policies, totalItems, params.page, params.limit)
        });
    }
    async getPolicy(req, res) {
        const policy = await policy_service_1.policyService.getPolicyById(req.params.id, req.user.orgId);
        res.status(200).json({ success: true, data: policy });
    }
    async updatePolicy(req, res) {
        const policy = await policy_service_1.policyService.updatePolicy(req.params.id, req.user.orgId, req.body);
        res.status(200).json({ success: true, message: 'Policy updated successfully', data: policy });
    }
    async deletePolicy(req, res) {
        await policy_service_1.policyService.deletePolicy(req.params.id, req.user.orgId, req.user.isRoot);
        res.status(200).json({ success: true, message: 'Policy deleted successfully' });
    }
}
exports.policyController = new PolicyController();
