"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundaryIdParamSchema = exports.assignBoundarySchema = void 0;
const zod_1 = require("zod");
/**
 * Body schema for PUT /api/iam/users/:id/boundary
 * API_REGISTRY §4: body must contain a valid UUID policyId.
 * The service layer enforces that the policy is MANAGED.
 */
exports.assignBoundarySchema = zod_1.z.object({
    policyId: zod_1.z.string().trim().uuid('Invalid policy ID format'),
});
/**
 * Param schema shared across all boundary endpoints (/api/iam/users/:id/boundary).
 * Reuses the same UUID validation as the users module.
 */
exports.boundaryIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().uuid('Invalid user ID format'),
});
