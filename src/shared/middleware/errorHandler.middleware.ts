import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unexpected error', err as any);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message || err.toString(),
  });
};
