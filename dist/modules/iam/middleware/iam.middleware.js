"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamCheck = void 0;
const evaluation_service_1 = require("../evaluation/evaluation.service");
const logger_1 = require("../../../shared/utils/logger");
// IAM Authorization Middleware Factory.
// Delegates authorization to Permission Evaluation Service.
const iamCheck = (actions) => {
    return async (req, res, next) => {
        // Guard: auth middleware must have already run and attached req.user
        if (!req.user) {
            logger_1.logger.warn('[IAM] iamCheck called before authMiddleware — req.user is missing', { actions });
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
            logger_1.logger.info('[IAM] Root bypass', { userId, actions: actionList, route, result: 'ALLOWED' });
            next();
            return;
        }
        try {
            let allowed = false;
            for (const action of actionList) {
                if (await evaluation_service_1.permissionService.canPerformAction(userId, action)) {
                    allowed = true;
                    break;
                }
            }
            logger_1.logger.info('[IAM] Authorization evaluated', {
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
        }
        catch (error) {
            // Deny by default on unexpected error.
            logger_1.logger.error('[IAM] Permission evaluation threw an unexpected error — denying by default', {
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
exports.iamCheck = iamCheck;
