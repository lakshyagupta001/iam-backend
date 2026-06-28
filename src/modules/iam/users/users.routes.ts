import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../../shared/middleware/validate.middleware';
import { attachPolicySchema, createUserSchema, idParamSchema, userPolicyParamSchema } from './users.validation';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requireRoot } from '../middleware/rbac.middleware';
import { iamCheck } from '../middleware/iam.middleware';
import asyncHandler from 'express-async-handler';
import { boundaryController } from '../boundaries/boundaries.controller';
import { assignBoundarySchema, boundaryIdParamSchema } from '../boundaries/boundaries.validation';

export const usersRoutes = Router();

// All routes require authentication
usersRoutes.use(authMiddleware);

usersRoutes.get('/', iamCheck('iam:ListUsers'), asyncHandler(usersController.listUsers));
// Create User: requires root privilege (PRD §5 — only root creates users)
usersRoutes.post('/', requireRoot, validate(createUserSchema), asyncHandler(usersController.createUser));

usersRoutes.get('/:id', iamCheck('iam:GetUser'), validate(idParamSchema, 'params'), asyncHandler(usersController.getUser));
usersRoutes.get('/:id/effective-permissions', iamCheck('iam:GetUser'), validate(idParamSchema, 'params'), asyncHandler(usersController.getEffectivePermissions));

usersRoutes.post('/:id/policies', iamCheck('iam:AttachUserPolicy'), validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(usersController.attachPolicy));
usersRoutes.delete('/:id/policies/:policyId', iamCheck('iam:DetachUserPolicy'), validate(userPolicyParamSchema, 'params'), asyncHandler(usersController.detachPolicy));

// ── Permission Boundaries ──────────────────────────────────────────────────────
// PUT and DELETE are root-only per PRD §5:
//   "Only role that can call PUT/DELETE /api/iam/users/:id/boundary —
//    hardcoded isRoot check, bypasses the policy engine entirely."
// GET is protected by iam:GetUser (non-root users with that permission can read it).
usersRoutes.put('/:id/boundary', requireRoot, validate(boundaryIdParamSchema, 'params'), validate(assignBoundarySchema), asyncHandler(boundaryController.assignBoundary));
usersRoutes.get('/:id/boundary', iamCheck('iam:GetUser'), validate(boundaryIdParamSchema, 'params'), asyncHandler(boundaryController.getBoundary));
usersRoutes.delete('/:id/boundary', requireRoot, validate(boundaryIdParamSchema, 'params'), asyncHandler(boundaryController.removeBoundary));

