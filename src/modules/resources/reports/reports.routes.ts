import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { reportsController } from './reports.controller';
import { validate } from '../../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { iamCheck } from '../../iam/middleware/iam.middleware';
import { createReportSchema, updateReportSchema } from './reports.validation';

export const reportsRoutes = Router();

reportsRoutes.use(authMiddleware);

reportsRoutes.get('/', iamCheck('reports:Read'), asyncHandler(reportsController.list));
reportsRoutes.get('/:id', iamCheck('reports:Read'), asyncHandler(reportsController.get));
reportsRoutes.post('/', iamCheck('reports:Create'), validate(createReportSchema), asyncHandler(reportsController.create));
reportsRoutes.put('/:id', iamCheck('reports:Update'), validate(updateReportSchema), asyncHandler(reportsController.update));
reportsRoutes.delete('/:id', iamCheck('reports:Delete'), asyncHandler(reportsController.delete));
