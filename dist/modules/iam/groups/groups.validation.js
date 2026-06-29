"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupPolicyParamSchema = exports.groupUserParamSchema = exports.idParamSchema = exports.attachPolicySchema = exports.addMemberSchema = exports.groupQuerySchema = exports.updateGroupSchema = exports.createGroupSchema = void 0;
const zod_1 = require("zod");
exports.createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name is required'),
    description: zod_1.z.string().trim().optional(),
});
exports.updateGroupSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Name cannot be empty').optional(),
    description: zod_1.z.string().trim().optional(),
});
exports.groupQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).optional(),
    limit: zod_1.z.coerce.number().min(1).optional(),
    search: zod_1.z.string().trim().optional(),
    sort: zod_1.z.string().trim().optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().trim().min(1, 'User ID is required'),
});
exports.attachPolicySchema = zod_1.z.object({
    policyId: zod_1.z.string().trim().uuid('Invalid policy ID format'),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid UUID format'),
});
exports.groupUserParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid UUID format'),
    userId: zod_1.z.string().trim().uuid('Invalid UUID format'),
});
exports.groupPolicyParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid UUID format'),
    policyId: zod_1.z.string().trim().uuid('Invalid UUID format'),
});
