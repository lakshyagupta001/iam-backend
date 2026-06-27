import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { attachPolicySchema, createUserSchema, idParamSchema, userPolicyParamSchema } from './users.validation';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRoot } from '../../shared/middleware/rbac.middleware';
import asyncHandler from 'express-async-handler';

export const usersRoutes = Router();

// All user management routes require authentication AND root privileges
usersRoutes.use(authMiddleware, requireRoot);

usersRoutes.get('/', asyncHandler(usersController.listUsers));
usersRoutes.post('/', validate(createUserSchema), asyncHandler(usersController.createUser));

usersRoutes.post('/:id/policies', validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(usersController.attachPolicy));
usersRoutes.delete('/:id/policies/:policyId', validate(userPolicyParamSchema, 'params'), asyncHandler(usersController.detachPolicy));
