"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const users_validation_1 = require("./users.validation");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const rbac_middleware_1 = require("../../shared/middleware/rbac.middleware");
const iam_middleware_1 = require("../../shared/middleware/iam.middleware");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const boundary_controller_1 = require("../boundary/boundary.controller");
const boundary_validation_1 = require("../boundary/boundary.validation");
exports.usersRoutes = (0, express_1.Router)();
// All routes require authentication
exports.usersRoutes.use(auth_middleware_1.authMiddleware);
exports.usersRoutes.get('/', (0, iam_middleware_1.iamCheck)('iam:ListUsers'), (0, express_async_handler_1.default)(users_controller_1.usersController.listUsers));
// Create User: requires root privilege (PRD §5 — only root creates users)
exports.usersRoutes.post('/', rbac_middleware_1.requireRoot, (0, validate_middleware_1.validate)(users_validation_1.createUserSchema), (0, express_async_handler_1.default)(users_controller_1.usersController.createUser));
exports.usersRoutes.get('/:id', (0, iam_middleware_1.iamCheck)('iam:GetUser'), (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.getUser));
exports.usersRoutes.get('/:id/effective-permissions', (0, iam_middleware_1.iamCheck)('iam:GetUser'), (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.getEffectivePermissions));
exports.usersRoutes.post('/:id/policies', (0, iam_middleware_1.iamCheck)('iam:AttachUserPolicy'), (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, validate_middleware_1.validate)(users_validation_1.attachPolicySchema), (0, express_async_handler_1.default)(users_controller_1.usersController.attachPolicy));
exports.usersRoutes.delete('/:id/policies/:policyId', (0, iam_middleware_1.iamCheck)('iam:DetachUserPolicy'), (0, validate_middleware_1.validate)(users_validation_1.userPolicyParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.detachPolicy));
// ── Permission Boundaries ──────────────────────────────────────────────────────
// PUT and DELETE are root-only per PRD §5:
//   "Only role that can call PUT/DELETE /api/iam/users/:id/boundary —
//    hardcoded isRoot check, bypasses the policy engine entirely."
// GET is protected by iam:GetUser (non-root users with that permission can read it).
exports.usersRoutes.put('/:id/boundary', rbac_middleware_1.requireRoot, (0, validate_middleware_1.validate)(boundary_validation_1.boundaryIdParamSchema, 'params'), (0, validate_middleware_1.validate)(boundary_validation_1.assignBoundarySchema), (0, express_async_handler_1.default)(boundary_controller_1.boundaryController.assignBoundary));
exports.usersRoutes.get('/:id/boundary', (0, iam_middleware_1.iamCheck)('iam:GetUser'), (0, validate_middleware_1.validate)(boundary_validation_1.boundaryIdParamSchema, 'params'), (0, express_async_handler_1.default)(boundary_controller_1.boundaryController.getBoundary));
exports.usersRoutes.delete('/:id/boundary', rbac_middleware_1.requireRoot, (0, validate_middleware_1.validate)(boundary_validation_1.boundaryIdParamSchema, 'params'), (0, express_async_handler_1.default)(boundary_controller_1.boundaryController.removeBoundary));
