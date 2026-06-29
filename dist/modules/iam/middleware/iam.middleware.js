"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamCheck = void 0;
const evaluation_service_1 = require("../evaluation/evaluation.service");
const logger_1 = require("../../../shared/utils/logger");
/**
 * IAM Authorization Middleware Factory.
 *
 * Returns a middleware that delegates the authorization decision entirely to the
 * existing Permission Evaluation Service. The middleware itself contains NO
 * evaluation logic — it is a thin adapter between Express and the evaluator.
 *
 * Usage in routes:
 *   router.post('/', authMiddleware, iamCheck('iam:CreatePolicy'), asyncHandler(controller.create));
 *
 * Flow:
 *   1. Asserts auth has already run (req.user must exist).
 *   2. Root users are fast-pathed to next() — the service handles this, but we
 *      short-circuit here to avoid a DB round-trip and log it clearly.
 *   3. Calls permissionService.canPerformAction(userId, action).
 *   4. Allowed → next().
 *   5. Denied → 403 with a consistent JSON error body.
 */
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
        // Root users bypass the evaluation engine entirely (per PRD §5 and ARCHITECTURE §2)
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
            // If the permission service fails for any reason, deny by default (fail-closed)
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
