import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { attachPolicySchema, createUserSchema, idParamSchema, userPolicyParamSchema } from './users.validation';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRoot } from '../../shared/middleware/rbac.middleware';
import asyncHandler from 'express-async-handler';

export const usersRoutes = Router();

// All routes require authentication
usersRoutes.use(authMiddleware);

// Create User remains Root-only (registration is handled separately via /auth/register)
usersRoutes.get('/', asyncHandler(usersController.listUsers));
usersRoutes.post('/', requireRoot, validate(createUserSchema), asyncHandler(usersController.createUser));

usersRoutes.get('/:id', validate(idParamSchema, 'params'), asyncHandler(usersController.getUser));
usersRoutes.get('/:id/effective-permissions', validate(idParamSchema, 'params'), asyncHandler(usersController.getEffectivePermissions));

usersRoutes.post('/:id/policies', validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(usersController.attachPolicy));
usersRoutes.delete('/:id/policies/:policyId', validate(userPolicyParamSchema, 'params'), asyncHandler(usersController.detachPolicy));
