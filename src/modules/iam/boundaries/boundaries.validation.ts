import { z } from 'zod';

/**
 * Body schema for PUT /api/iam/users/:id/boundary
 * API_REGISTRY §4: body must contain a valid UUID policyId.
 * The service layer enforces that the policy is MANAGED.
 */
export const assignBoundarySchema = z.object({
  policyId: z.string().trim().uuid('Invalid policy ID format'),
});

/**
 * Param schema shared across all boundary endpoints (/api/iam/users/:id/boundary).
 * Reuses the same UUID validation as the users module.
 */
export const boundaryIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid user ID format'),
});
