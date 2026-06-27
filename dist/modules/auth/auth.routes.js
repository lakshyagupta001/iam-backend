"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const auth_validation_1 = require("./auth.validation");
exports.authRoutes = (0, express_1.Router)();
exports.authRoutes.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), (0, express_async_handler_1.default)(auth_controller_1.authController.register));
exports.authRoutes.post('/login', (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), (0, express_async_handler_1.default)(auth_controller_1.authController.login));
exports.authRoutes.post('/refresh', (0, express_async_handler_1.default)(auth_controller_1.authController.refresh));
exports.authRoutes.post('/logout', auth_middleware_1.authMiddleware, (0, express_async_handler_1.default)(auth_controller_1.authController.logout));
exports.authRoutes.get('/me', auth_middleware_1.authMiddleware, (0, express_async_handler_1.default)(auth_controller_1.authController.me));
