"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingSchema = void 0;
const zod_1 = require("zod");
exports.updateSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(1, 'Key is required').max(100, 'Key is too long'),
    value: zod_1.z.string().min(1, 'Value is required').max(500, 'Value is too long'),
});
