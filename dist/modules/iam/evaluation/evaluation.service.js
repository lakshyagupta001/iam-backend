"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = void 0;
const evaluation_repository_1 = require("./evaluation.repository");
const iam_constants_1 = require("../shared/iam.constants");
class PermissionService {
    // Evaluates statements: Explicit Deny -> Explicit Allow -> Implicit Deny.
    evaluateStatements(statements, action) {
        // 1. Check for Explicit Deny
        const hasDeny = statements.some((stmt) => stmt.effect === 'DENY' &&
            (stmt.actions.includes(action) || stmt.actions.includes('*')));
        if (hasDeny) {
            return false; // Explicit Deny always wins
        }
        // 2. Check for Explicit Allow
        const hasAllow = statements.some((stmt) => stmt.effect === 'ALLOW' &&
            (stmt.actions.includes(action) || stmt.actions.includes('*')));
        if (hasAllow) {
            return true;
        }
        // 3. Implicit Deny (no allow found)
        return false;
    }
    // Single source of truth for authorization. Evaluates policies and boundaries.
    async canPerformAction(userId, action) {
        const data = await evaluation_repository_1.permissionRepository.getEvaluationData(userId);
        // If user not found, or any issue fetching, fail gracefully (deny)
        if (!data) {
            this.logEvaluation(userId, action, 'DENIED', 'User not found');
            return false;
        }
        // Root user always bypasses evaluation and gets all permissions
        if (data.isRoot) {
            this.logEvaluation(userId, action, 'ALLOWED', 'Root bypass');
            return true;
        }
        // Step 1 & 2 & 3: Evaluate base statements (Direct + Group)
        const isAllowedByPolicies = this.evaluateStatements(data.statements, action);
        if (!isAllowedByPolicies) {
            this.logEvaluation(userId, action, 'DENIED', 'No allow found or Explicit Deny in policies');
            return false;
        }
        // Step 4: Evaluate Boundary (if exists)
        if (data.boundaryStatements) {
            const isAllowedByBoundary = this.evaluateStatements(data.boundaryStatements, action);
            if (!isAllowedByBoundary) {
                this.logEvaluation(userId, action, 'DENIED', 'Blocked by Permission Boundary');
                return false;
            }
        }
        // Step 5: Final Allow
        this.logEvaluation(userId, action, 'ALLOWED', 'Allowed by policies and boundary');
        return true;
    }
    // Computes Effective Permissions Summary for all actions.
    async getEffectivePermissions(userId) {
        const data = await evaluation_repository_1.permissionRepository.getEvaluationData(userId);
        // Initialize summary with false for all actions
        const summary = {};
        for (const action of iam_constants_1.IAM_ACTIONS) {
            summary[action] = false;
        }
        if (!data) {
            return summary; // User not found, default to false
        }
        if (data.isRoot) {
            for (const action of iam_constants_1.IAM_ACTIONS) {
                summary[action] = true;
            }
            return summary;
        }
        // Evaluate each action independently
        for (const action of iam_constants_1.IAM_ACTIONS) {
            const isAllowedByPolicies = this.evaluateStatements(data.statements, action);
            if (!isAllowedByPolicies) {
                summary[action] = false;
                continue;
            }
            if (data.boundaryStatements) {
                const isAllowedByBoundary = this.evaluateStatements(data.boundaryStatements, action);
                if (!isAllowedByBoundary) {
                    summary[action] = false;
                    continue;
                }
            }
            summary[action] = true;
        }
        return summary;
    }
    logEvaluation(userId, action, decision, reason) {
        // Log standard eval result. Use proper logger in production.
        // console.log(`[PermissionEngine] User: ${userId} | Action: ${action} | Decision: ${decision} | Reason: ${reason}`);
    }
}
exports.permissionService = new PermissionService();
