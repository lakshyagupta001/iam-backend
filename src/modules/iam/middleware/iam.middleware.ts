import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../evaluation/evaluation.service';
import { IamAction } from '../shared/iam.constants';
import { logger } from '../../../shared/utils/logger';

// IAM Authorization Middleware Factory.
// Delegates authorization to Permission Evaluation Service.
export const iamCheck = (actions: IamAction | IamAction[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Guard: auth middleware must have already run and attached req.user
    if (!req.user) {
      logger.warn('[IAM] iamCheck called before authMiddleware — req.user is missing', { actions });
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication is required before authorization.',
      });
      return;
    }

    const { id: userId, isRoot } = req.user;
    const route = `${req.method} ${req.originalUrl}`;
    const actionList = Array.isArray(actions) ? actions : [actions];

    // Root users bypass evaluation.
    if (isRoot) {
      logger.info('[IAM] Root bypass', { userId, actions: actionList, route, result: 'ALLOWED' });
      next();
      return;
    }

    try {
      let allowed = false;
      for (const action of actionList) {
        if (await permissionService.canPerformAction(userId, action)) {
          allowed = true;
          break;
        }
      }

      logger.info('[IAM] Authorization evaluated', {
        userId,
        actions: actionList,
        route,
        result: allowed ? 'ALLOWED' : 'DENIED',
      });

      if (!allowed) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to perform this action.',
        });
        return;
      }

      next();
    } catch (error) {
      // Deny by default on unexpected error.
      logger.error('[IAM] Permission evaluation threw an unexpected error — denying by default', {
        userId,
        actions: actionList,
        route,
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(403).json({
        success: false,
        message: 'Access denied. Authorization check could not be completed.',
      });
    }
  };
};
