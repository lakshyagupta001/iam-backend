"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyQuerySchema = exports.updatePolicySchema = exports.createPolicySchema = void 0;
const zod_1 = require("zod");
const iam_constants_1 = require("../shared/iam.constants");
const client_1 = require("@prisma/client");
const effectEnum = zod_1.z.string().transform(v => v.toUpperCase()).pipe(zod_1.z.enum([client_1.Effect.ALLOW, client_1.Effect.DENY]));
const policyTypeEnum = zod_1.z.enum([client_1.PolicyType.MANAGED, client_1.PolicyType.INLINE]);
const actionEnum = zod_1.z.enum(iam_constants_1.IAM_ACTIONS);
const statementSchema = zod_1.z.object({
    effect: effectEnum,
    actions: zod_1.z.array(actionEnum)
        .min(1, 'At least one action is required per statement')
        .transform(actions => [...new Set(actions)]), // deduplicate
    resource: zod_1.z.string().trim().default('*'),
});
exports.createPolicySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Policy name is required'),
    description: zod_1.z.string().trim().optional(),
    type: policyTypeEnum,
    statements: zod_1.z.array(statementSchema).min(1, 'At least one statement is required'),
});
exports.updatePolicySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    description: zod_1.z.string().trim().optional(),
    statements: zod_1.z.array(statementSchema).min(1).optional(),
});
exports.policyQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    search: zod_1.z.string().trim().optional(),
    type: policyTypeEnum.optional(),
    sort: zod_1.z.string().trim().optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
});
