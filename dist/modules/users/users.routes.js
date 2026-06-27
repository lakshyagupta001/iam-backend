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
// All user management routes require authentication AND root privileges
exports.usersRoutes.use(auth_middleware_1.authMiddleware, rbac_middleware_1.requireRoot);
exports.usersRoutes.get('/', (0, express_async_handler_1.default)(users_controller_1.usersController.listUsers));
exports.usersRoutes.post('/', (0, validate_middleware_1.validate)(users_validation_1.createUserSchema), (0, express_async_handler_1.default)(users_controller_1.usersController.createUser));
