import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { policyController } from './policy.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { iamCheck } from '../../shared/middleware/iam.middleware';
import { createPolicySchema, updatePolicySchema } from './policy.validation';

export const policyRoutes = Router();

policyRoutes.use(authMiddleware);

policyRoutes.post('/', iamCheck('iam:CreatePolicy'), validate(createPolicySchema), asyncHandler(policyController.createPolicy));
policyRoutes.get('/', iamCheck('iam:ListPolicies'), asyncHandler(policyController.listPolicies));
policyRoutes.get('/:id', iamCheck('iam:GetPolicy'), asyncHandler(policyController.getPolicy));
policyRoutes.put('/:id', iamCheck('iam:UpdatePolicy'), validate(updatePolicySchema), asyncHandler(policyController.updatePolicy));
policyRoutes.delete('/:id', iamCheck('iam:DeletePolicy'), asyncHandler(policyController.deletePolicy));
