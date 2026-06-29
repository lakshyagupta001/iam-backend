import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { auditController } from './audit.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { iamCheck } from '../../iam/middleware/iam.middleware';

export const auditRoutes = Router();

auditRoutes.use(authMiddleware);

auditRoutes.get('/', iamCheck('audit:List'), asyncHandler(auditController.list));
auditRoutes.get('/:id', iamCheck('audit:Read'), asyncHandler(auditController.get));
