import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { settingsController } from './settings.controller';
import { validate } from '../../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { iamCheck } from '../../iam/middleware/iam.middleware';
import { updateSettingSchema } from './settings.validation';

export const settingsRoutes = Router();

settingsRoutes.use(authMiddleware);

settingsRoutes.get('/', iamCheck('settings:Read'), asyncHandler(settingsController.list));
settingsRoutes.put('/', iamCheck('settings:Update'), validate(updateSettingSchema), asyncHandler(settingsController.update));
