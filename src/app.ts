import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './shared/config/env';
import { errorHandler } from './shared/middleware/errorHandler.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { groupRoutes } from './modules/group/group.routes';
import { policyRoutes } from './modules/policy/policy.routes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Adjust based on frontend config
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 1000 : 100,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/iam/users', usersRoutes);
app.use('/api/iam/groups', groupRoutes);
app.use('/api/iam/policies', policyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', env: env.NODE_ENV });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
