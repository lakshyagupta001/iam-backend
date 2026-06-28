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
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.usersRoutes = (0, express_1.Router)();
// All routes require authentication
exports.usersRoutes.use(auth_middleware_1.authMiddleware);
// Create User remains Root-only (registration is handled separately via /auth/register)
exports.usersRoutes.get('/', (0, express_async_handler_1.default)(users_controller_1.usersController.listUsers));
exports.usersRoutes.post('/', rbac_middleware_1.requireRoot, (0, validate_middleware_1.validate)(users_validation_1.createUserSchema), (0, express_async_handler_1.default)(users_controller_1.usersController.createUser));
exports.usersRoutes.get('/:id', (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.getUser));
exports.usersRoutes.get('/:id/effective-permissions', (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.getEffectivePermissions));
exports.usersRoutes.post('/:id/policies', (0, validate_middleware_1.validate)(users_validation_1.idParamSchema, 'params'), (0, validate_middleware_1.validate)(users_validation_1.attachPolicySchema), (0, express_async_handler_1.default)(users_controller_1.usersController.attachPolicy));
exports.usersRoutes.delete('/:id/policies/:policyId', (0, validate_middleware_1.validate)(users_validation_1.userPolicyParamSchema, 'params'), (0, express_async_handler_1.default)(users_controller_1.usersController.detachPolicy));
