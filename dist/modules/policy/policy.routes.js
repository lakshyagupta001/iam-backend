"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRoutes = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const policy_controller_1 = require("./policy.controller");
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const policy_validation_1 = require("./policy.validation");
exports.policyRoutes = (0, express_1.Router)();
exports.policyRoutes.use(auth_middleware_1.authMiddleware);
exports.policyRoutes.post('/', (0, validate_middleware_1.validate)(policy_validation_1.createPolicySchema), (0, express_async_handler_1.default)(policy_controller_1.policyController.createPolicy));
exports.policyRoutes.get('/', (0, express_async_handler_1.default)(policy_controller_1.policyController.listPolicies));
exports.policyRoutes.get('/:id', (0, express_async_handler_1.default)(policy_controller_1.policyController.getPolicy));
exports.policyRoutes.put('/:id', (0, validate_middleware_1.validate)(policy_validation_1.updatePolicySchema), (0, express_async_handler_1.default)(policy_controller_1.policyController.updatePolicy));
exports.policyRoutes.delete('/:id', (0, express_async_handler_1.default)(policy_controller_1.policyController.deletePolicy));
