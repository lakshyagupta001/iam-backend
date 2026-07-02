import { Effect, PolicyStatement } from '@prisma/client';
import { AppError } from '../../../shared/utils/AppError';
import { logger } from '../../../shared/utils/logger';
import { permissionService } from '../evaluation/evaluation.service';
import { policyRepository } from '../policies/policies.repository';
import { IamAction, IAM_ACTIONS } from '../shared/iam.constants';
import { PolicyStatementDto } from '../policies/policies.types';

// Delegation Bypass Prevention Service
// Enforces that a user cannot grant an Allow permission they do not possess.
const DBP_ERROR_MESSAGE =
  'Delegation Bypass Prevention: You cannot grant permissions you do not currently possess.';

// Context object for structured logging.
interface DbpLogContext {
  requestingUserId: string;
  operation: 'CreatePolicy' | 'UpdatePolicy' | 'AttachUserPolicy' | 'AttachGroupPolicy';
  policyName?: string;
  policyId?: string;
}

class DelegationBypassService {
  // Core validation for DBP algorithm

  // Checks if the requesting user holds all actions listed in Allow statements.
  // Throws AppError(403) on failure.
  async checkAllowStatements(
    requestingUserId: string,
    statements: PolicyStatementDto[],
    ctx: DbpLogContext
  ): Promise<void> {
    for (const statement of statements) {
      // Only validate Allow statements — Deny statements do not escalate privilege
      if (statement.effect !== Effect.ALLOW) {
        continue;
      }

      for (const action of statement.actions) {
        const held = await permissionService.canPerformAction(requestingUserId, action as IamAction);

        if (!held) {
          logger.warn('[DBP] Delegation Bypass Prevention blocked', {
            requestingUserId: ctx.requestingUserId,
            operation: ctx.operation,
            policyName: ctx.policyName,
            policyId: ctx.policyId,
            failedAction: action,
            result: 'REJECTED',
          });

          throw new AppError(403, DBP_ERROR_MESSAGE);
        }
      }
    }

    logger.info('[DBP] Delegation Bypass Prevention passed', {
      requestingUserId: ctx.requestingUserId,
      operation: ctx.operation,
      policyName: ctx.policyName,
      policyId: ctx.policyId,
      result: 'ALLOWED',
    });
  }

  // Synchronous check used for in-memory filtering.
  checkAllowStatementsSync(
    effectivePerms: Record<IamAction, boolean>,
    statements: { effect: string; actions: string[] }[]
  ): boolean {
    for (const statement of statements) {
      if (statement.effect !== Effect.ALLOW) {
        continue;
      }

      for (const action of statement.actions) {
        if (action === '*') {
          // If the policy grants '*', the user must have ALL IAM actions
          const hasAll = IAM_ACTIONS.every(a => effectivePerms[a]);
          if (!hasAll) return false;
        } else {
          // Otherwise, the user must have the specific action
          if (!effectivePerms[action as IamAction]) return false;
        }
      }
    }
    return true;
  }

  // Public entry points

  // Validates before policy creation.
  async validateForPolicyCreate(
    requestingUserId: string,
    policyName: string,
    statements: PolicyStatementDto[]
  ): Promise<void> {
    await this.checkAllowStatements(requestingUserId, statements, {
      requestingUserId,
      operation: 'CreatePolicy',
      policyName,
    });
  }

  // Validates before updating policy statements.
  async validateForPolicyUpdate(
    requestingUserId: string,
    policyId: string,
    policyName: string,
    statements: PolicyStatementDto[]
  ): Promise<void> {
    await this.checkAllowStatements(requestingUserId, statements, {
      requestingUserId,
      operation: 'UpdatePolicy',
      policyId,
      policyName,
    });
  }

  // Validates before attaching a policy to a user.
  async validateForUserPolicyAttachment(
    requestingUserId: string,
    policyId: string,
    organizationId: string
  ): Promise<void> {
    const policy = await policyRepository.findPolicyById(policyId, organizationId);
    if (!policy) {
      // The calling service already validates policy existence and throws 404.
      // Reaching here would be a logic error; re-throw 404 defensively.
      throw new AppError(404, 'Policy not found');
    }

    // Map Prisma PolicyStatement → PolicyStatementDto shape that checkAllowStatements expects
    const statements: PolicyStatementDto[] = policy.statements.map((s: PolicyStatement) => ({
      effect: s.effect,
      actions: s.actions as IamAction[],
      resource: s.resource,
    }));

    await this.checkAllowStatements(requestingUserId, statements, {
      requestingUserId,
      operation: 'AttachUserPolicy',
      policyId,
      policyName: policy.name,
    });
  }

  // Validates before attaching a policy to a group.
  async validateForGroupPolicyAttachment(
    requestingUserId: string,
    policyId: string,
    organizationId: string
  ): Promise<void> {
    const policy = await policyRepository.findPolicyById(policyId, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    const statements: PolicyStatementDto[] = policy.statements.map((s: PolicyStatement) => ({
      effect: s.effect,
      actions: s.actions as IamAction[],
      resource: s.resource,
    }));

    await this.checkAllowStatements(requestingUserId, statements, {
      requestingUserId,
      operation: 'AttachGroupPolicy',
      policyId,
      policyName: policy.name,
    });
  }
}

export const delegationBypassService = new DelegationBypassService();
