"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPolicyParamSchema = exports.idParamSchema = exports.attachPolicySchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required'),
    email: zod_1.z.string().trim().toLowerCase().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
});
exports.attachPolicySchema = zod_1.z.object({
    policyId: zod_1.z.string().trim().uuid('Invalid policy ID format'),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid UUID format'),
});
exports.userPolicyParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid UUID format'),
    policyId: zod_1.z.string().trim().uuid('Invalid UUID format'),
});
