import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { groupController } from './group.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRoot } from '../../shared/middleware/rbac.middleware';
import { createGroupSchema, updateGroupSchema, addMemberSchema, groupQuerySchema, attachPolicySchema, idParamSchema, groupUserParamSchema, groupPolicyParamSchema } from './group.validation';

export const groupRoutes = Router();

groupRoutes.use(authMiddleware);

groupRoutes.post('/', requireRoot, validate(createGroupSchema), asyncHandler(groupController.createGroup));
groupRoutes.get('/', validate(groupQuerySchema, 'query'), asyncHandler(groupController.listGroups));
groupRoutes.get('/:id', validate(idParamSchema, 'params'), asyncHandler(groupController.getGroup));
groupRoutes.put('/:id', requireRoot, validate(idParamSchema, 'params'), validate(updateGroupSchema), asyncHandler(groupController.updateGroup));
groupRoutes.delete('/:id', requireRoot, validate(idParamSchema, 'params'), asyncHandler(groupController.deleteGroup));

groupRoutes.post('/:id/members', requireRoot, validate(idParamSchema, 'params'), validate(addMemberSchema), asyncHandler(groupController.addMember));
groupRoutes.delete('/:id/members/:userId', requireRoot, validate(groupUserParamSchema, 'params'), asyncHandler(groupController.removeMember));

groupRoutes.post('/:id/policies', requireRoot, validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(groupController.attachPolicy));
groupRoutes.delete('/:id/policies/:policyId', requireRoot, validate(groupPolicyParamSchema, 'params'), asyncHandler(groupController.detachPolicy));
