import { PolicyStatement } from '@prisma/client';
import { permissionRepository } from './permission.repository';
import { IamAction, IAM_ACTIONS } from '../policy/policy.constants';

class PermissionService {
  /**
   * Core logic to evaluate a list of statements against a single requested action.
   * - Evaluates Explicit Deny first (always wins).
   * - If no deny, searches for an Explicit Allow.
   * - If no allow, implicitly denies (returns false).
   */
  public evaluateStatements(statements: PolicyStatement[], action: IamAction): boolean {
    // 1. Check for Explicit Deny
    const hasDeny = statements.some(
      (stmt) =>
        stmt.effect === 'DENY' &&
        (stmt.actions.includes(action) || stmt.actions.includes('*'))
    );

    if (hasDeny) {
      return false; // Explicit Deny always wins
    }

    // 2. Check for Explicit Allow
    const hasAllow = statements.some(
      (stmt) =>
        stmt.effect === 'ALLOW' &&
        (stmt.actions.includes(action) || stmt.actions.includes('*'))
    );

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
  public async canPerformAction(userId: string, action: IamAction): Promise<boolean> {
    const data = await permissionRepository.getEvaluationData(userId);

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
  public async getEffectivePermissions(userId: string): Promise<Record<IamAction, boolean>> {
    const data = await permissionRepository.getEvaluationData(userId);
    
    // Initialize summary with false for all actions
    const summary = {} as Record<IamAction, boolean>;
    for (const action of IAM_ACTIONS) {
      summary[action] = false;
    }

    if (!data) {
      return summary; // User not found, default to false
    }

    if (data.isRoot) {
      for (const action of IAM_ACTIONS) {
        summary[action] = true;
      }
      return summary;
    }

    // Evaluate each action independently
    for (const action of IAM_ACTIONS) {
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

  private logEvaluation(userId: string, action: string, decision: 'ALLOWED' | 'DENIED', reason: string) {
    // Avoid logging sensitive data, just standard eval result
    // In production, this would go to a proper logger (Winston, Pino, etc.)
    // console.log(`[PermissionEngine] User: ${userId} | Action: ${action} | Decision: ${decision} | Reason: ${reason}`);
  }
}

export const permissionService = new PermissionService();
