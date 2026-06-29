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
import { IamAction } from '../shared/iam.constants';

export const usersRoutes = Router();

// All routes require authentication
usersRoutes.use(authMiddleware);

usersRoutes.get('/', iamCheck('iam:ListUsers'), asyncHandler(usersController.listUsers));
// Create User: requires root privilege (PRD §5 — only root creates users)
usersRoutes.post('/', requireRoot, validate(createUserSchema), asyncHandler(usersController.createUser));

// GET /:id — allowed if the caller has GetUser OR any access-management permission.
// This is required so that delegated admins (who have e.g. AttachUserPolicy but NOT GetUser)
// can open the Manage Access page and fetch the target user's current state.
const manageAccessPermissions: IamAction[] = [
  'iam:GetUser',
  'iam:AddUserToGroup',
  'iam:RemoveUserFromGroup',
  'iam:AttachUserPolicy',
  'iam:DetachUserPolicy',
  'iam:PutUserBoundary',
  'iam:DeleteUserBoundary',
];

usersRoutes.get('/:id', iamCheck(manageAccessPermissions), validate(idParamSchema, 'params'), asyncHandler(usersController.getUser));

// effective-permissions: any authenticated user may fetch their OWN permissions.
// Root users and users with iam:GetUser may fetch anyone's permissions.
// This route must NOT require iam:GetUser globally — users without that permission
// still need their effective permissions resolved on login so the frontend can
// evaluate all other permission checks.
usersRoutes.get('/:id/effective-permissions', validate(idParamSchema, 'params'), asyncHandler(usersController.getEffectivePermissions));

usersRoutes.post('/:id/policies', iamCheck('iam:AttachUserPolicy'), validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(usersController.attachPolicy));
usersRoutes.delete('/:id/policies/:policyId', iamCheck('iam:DetachUserPolicy'), validate(userPolicyParamSchema, 'params'), asyncHandler(usersController.detachPolicy));

// ── Permission Boundaries ──────────────────────────────────────────────────────
// PUT and DELETE are root-only per PRD §5:
//   "Only role that can call PUT/DELETE /api/iam/users/:id/boundary —
//    hardcoded isRoot check, bypasses the policy engine entirely."
// GET is allowed for GetUser or any boundary-management permission so the
// Manage Access page can display the current boundary without requiring GetUser.
usersRoutes.put('/:id/boundary', requireRoot, validate(boundaryIdParamSchema, 'params'), validate(assignBoundarySchema), asyncHandler(boundaryController.assignBoundary));
usersRoutes.get('/:id/boundary', iamCheck(['iam:GetUser', 'iam:PutUserBoundary', 'iam:DeleteUserBoundary']), validate(boundaryIdParamSchema, 'params'), asyncHandler(boundaryController.getBoundary));
usersRoutes.delete('/:id/boundary', requireRoot, validate(boundaryIdParamSchema, 'params'), asyncHandler(boundaryController.removeBoundary));
