import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { groupController } from './group.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { iamCheck } from '../../shared/middleware/iam.middleware';
import { createGroupSchema, updateGroupSchema, addMemberSchema, groupQuerySchema, attachPolicySchema, idParamSchema, groupUserParamSchema, groupPolicyParamSchema } from './group.validation';

export const groupRoutes = Router();

groupRoutes.use(authMiddleware);

groupRoutes.post('/', iamCheck('iam:CreateGroup'), validate(createGroupSchema), asyncHandler(groupController.createGroup));
groupRoutes.get('/', iamCheck('iam:ListGroups'), validate(groupQuerySchema, 'query'), asyncHandler(groupController.listGroups));
groupRoutes.get('/:id', iamCheck('iam:GetGroup'), validate(idParamSchema, 'params'), asyncHandler(groupController.getGroup));
groupRoutes.put('/:id', iamCheck('iam:UpdateGroup'), validate(idParamSchema, 'params'), validate(updateGroupSchema), asyncHandler(groupController.updateGroup));
groupRoutes.delete('/:id', iamCheck('iam:DeleteGroup'), validate(idParamSchema, 'params'), asyncHandler(groupController.deleteGroup));

groupRoutes.post('/:id/members', iamCheck('iam:AddUserToGroup'), validate(idParamSchema, 'params'), validate(addMemberSchema), asyncHandler(groupController.addMember));
groupRoutes.delete('/:id/members/:userId', iamCheck('iam:RemoveUserFromGroup'), validate(groupUserParamSchema, 'params'), asyncHandler(groupController.removeMember));

groupRoutes.post('/:id/policies', iamCheck('iam:AttachGroupPolicy'), validate(idParamSchema, 'params'), validate(attachPolicySchema), asyncHandler(groupController.attachPolicy));
groupRoutes.delete('/:id/policies/:policyId', iamCheck('iam:DetachGroupPolicy'), validate(groupPolicyParamSchema, 'params'), asyncHandler(groupController.detachPolicy));
