"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const audit_controller_1 = require("./audit.controller");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const iam_middleware_1 = require("../../iam/middleware/iam.middleware");
exports.auditRoutes = (0, express_1.Router)();
exports.auditRoutes.use(auth_middleware_1.authMiddleware);
exports.auditRoutes.get('/', (0, iam_middleware_1.iamCheck)('audit:List'), (0, express_async_handler_1.default)(audit_controller_1.auditController.list));
exports.auditRoutes.get('/:id', (0, iam_middleware_1.iamCheck)('audit:Read'), (0, express_async_handler_1.default)(audit_controller_1.auditController.get));
