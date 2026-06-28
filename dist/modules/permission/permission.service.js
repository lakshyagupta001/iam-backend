"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = void 0;
const permission_repository_1 = require("./permission.repository");
const policy_constants_1 = require("../policy/policy.constants");
class PermissionService {
    /**
     * Core logic to evaluate a list of statements against a single requested action.
     * - Evaluates Explicit Deny first (always wins).
     * - If no deny, searches for an Explicit Allow.
     * - If no allow, implicitly denies (returns false).
     */
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
    /**
     * Determines if a user can perform a specific action, considering policies and boundaries.
     * Returns a boolean. This is the single source of truth for authorization.
     */
    async canPerformAction(userId, action) {
        const data = await permission_repository_1.permissionRepository.getEvaluationData(userId);
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
    /**
     * Computes a full summary of permissions for a user across all known actions.
     * This is useful for returning the "Effective Permissions Summary" to the frontend.
     */
    async getEffectivePermissions(userId) {
        const data = await permission_repository_1.permissionRepository.getEvaluationData(userId);
        // Initialize summary with false for all actions
        const summary = {};
        for (const action of policy_constants_1.IAM_ACTIONS) {
            summary[action] = false;
        }
        if (!data) {
            return summary; // User not found, default to false
        }
        if (data.isRoot) {
            for (const action of policy_constants_1.IAM_ACTIONS) {
                summary[action] = true;
            }
            return summary;
        }
        // Evaluate each action independently
        for (const action of policy_constants_1.IAM_ACTIONS) {
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
        // Avoid logging sensitive data, just standard eval result
        // In production, this would go to a proper logger (Winston, Pino, etc.)
        // console.log(`[PermissionEngine] User: ${userId} | Action: ${action} | Decision: ${decision} | Reason: ${reason}`);
    }
}
exports.permissionService = new PermissionService();
