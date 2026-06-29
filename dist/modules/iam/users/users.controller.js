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
exports.usersController = void 0;
const users_service_1 = require("./users.service");
const pagination_1 = require("../../../shared/utils/pagination");
const evaluation_service_1 = require("../evaluation/evaluation.service");
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
        const userId = req.params.id;
        const requestingUser = req.user;
        // Security: a non-root user may only fetch their own effective permissions
        // unless they have iam:GetUser (checked via the IAM evaluation engine).
        // We check self-access here so the route can remain open for the login flow.
        const { permissionService: evalService } = await Promise.resolve().then(() => __importStar(require('../evaluation/evaluation.service')));
        const canGetOthers = requestingUser.isRoot || await evalService.canPerformAction(requestingUser.id, 'iam:GetUser');
        if (!canGetOthers && requestingUser.id !== userId) {
            res.status(403).json({ success: false, message: 'Access denied. You may only view your own effective permissions.' });
            return;
        }
        // Ensure the user exists in this organization before returning permissions
        await users_service_1.usersService.getUserById(userId, requestingUser.orgId);
        const permissions = await evaluation_service_1.permissionService.getEffectivePermissions(userId);
        res.status(200).json({ success: true, data: permissions });
    }
}
exports.usersController = new UsersController();
