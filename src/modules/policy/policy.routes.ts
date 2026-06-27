import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { policyController } from './policy.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createPolicySchema, updatePolicySchema } from './policy.validation';

export const policyRoutes = Router();

policyRoutes.use(authMiddleware);

policyRoutes.post('/', validate(createPolicySchema), asyncHandler(policyController.createPolicy));
policyRoutes.get('/', asyncHandler(policyController.listPolicies));
policyRoutes.get('/:id', asyncHandler(policyController.getPolicy));
policyRoutes.put('/:id', validate(updatePolicySchema), asyncHandler(policyController.updatePolicy));
policyRoutes.delete('/:id', asyncHandler(policyController.deletePolicy));
