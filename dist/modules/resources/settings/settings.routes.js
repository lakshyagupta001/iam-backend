"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const settings_controller_1 = require("./settings.controller");
const validate_middleware_1 = require("../../../shared/middleware/validate.middleware");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const iam_middleware_1 = require("../../iam/middleware/iam.middleware");
const settings_validation_1 = require("./settings.validation");
exports.settingsRoutes = (0, express_1.Router)();
exports.settingsRoutes.use(auth_middleware_1.authMiddleware);
exports.settingsRoutes.get('/', (0, iam_middleware_1.iamCheck)('settings:Read'), (0, express_async_handler_1.default)(settings_controller_1.settingsController.list));
exports.settingsRoutes.put('/', (0, iam_middleware_1.iamCheck)('settings:Update'), (0, validate_middleware_1.validate)(settings_validation_1.updateSettingSchema), (0, express_async_handler_1.default)(settings_controller_1.settingsController.update));
