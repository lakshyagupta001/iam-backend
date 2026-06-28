import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { alertsController } from './alerts.controller';
import { validate } from '../../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { iamCheck } from '../../iam/middleware/iam.middleware';
import { createAlertSchema, updateAlertSchema } from './alerts.validation';

export const alertsRoutes = Router();

alertsRoutes.use(authMiddleware);

alertsRoutes.get('/', iamCheck('alerts:Read'), asyncHandler(alertsController.list));
alertsRoutes.get('/:id', iamCheck('alerts:Read'), asyncHandler(alertsController.get));
alertsRoutes.post('/', iamCheck('alerts:Create'), validate(createAlertSchema), asyncHandler(alertsController.create));
alertsRoutes.put('/:id', iamCheck('alerts:Update'), validate(updateAlertSchema), asyncHandler(alertsController.update));
alertsRoutes.delete('/:id', iamCheck('alerts:Delete'), asyncHandler(alertsController.delete));
