import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireRoot = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, 'Unauthorized'));
  }

  if (!req.user.isRoot) {
    return next(new AppError(403, 'Access denied: Root privileges required'));
  }

  next();
};
