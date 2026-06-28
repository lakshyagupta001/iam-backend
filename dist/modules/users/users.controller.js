"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const users_service_1 = require("./users.service");
const pagination_1 = require("../../shared/utils/pagination");
const permission_service_1 = require("../permission/permission.service");
class UsersController {
    async listUsers(req, res) {
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const { totalItems, users } = await users_service_1.usersService.listUsers(req.user.orgId, params);
        res.status(200).json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(users, totalItems, params.page, params.limit)
        });
    }
    async createUser(req, res) {
        const user = await users_service_1.usersService.createUser(req.user.orgId, req.body);
        res.status(201).json({ success: true, data: user, message: 'User created successfully' });
    }
    async getUser(req, res) {
        const user = await users_service_1.usersService.getUserById(req.params.id, req.user.orgId);
        res.status(200).json({ success: true, data: user });
    }
    async attachPolicy(req, res) {
        const userId = req.params.id;
        const { policyId } = req.body;
        await users_service_1.usersService.attachPolicy(userId, policyId, req.user.orgId, req.user.id);
        res.status(201).json({ success: true, message: 'Policy attached successfully' });
    }
    async detachPolicy(req, res) {
        const userId = req.params.id;
        const policyId = req.params.policyId;
        await users_service_1.usersService.detachPolicy(userId, policyId, req.user.orgId);
        res.status(200).json({ success: true, message: 'Policy detached successfully' });
    }
    async getEffectivePermissions(req, res) {
        // 1. Validate the user ID (already done by idParamSchema in routes)
        const userId = req.params.id;
        // Ensure the user exists in this organization before returning permissions
        // We can just call getUserById which throws 404 if not found
        await users_service_1.usersService.getUserById(userId, req.user.orgId);
        // 2. Call the existing Permission Evaluation Service
        const permissions = await permission_service_1.permissionService.getEffectivePermissions(userId);
        // 3. Return the calculated effective permissions
        res.status(200).json({ success: true, data: permissions });
    }
}
exports.usersController = new UsersController();
