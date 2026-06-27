import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authController } from './auth.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { loginSchema, registerSchema } from './auth.validation';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), asyncHandler(authController.register));
authRoutes.post('/login', validate(loginSchema), asyncHandler(authController.login));
authRoutes.post('/refresh', asyncHandler(authController.refresh));
authRoutes.post('/logout', authMiddleware, asyncHandler(authController.logout));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.me));
