"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegationBypassService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../../../shared/utils/AppError");
const logger_1 = require("../../../shared/utils/logger");
const evaluation_service_1 = require("../evaluation/evaluation.service");
const policies_repository_1 = require("../policies/policies.repository");
const iam_constants_1 = require("../shared/iam.constants");
// Delegation Bypass Prevention Service
// Enforces that a user cannot grant an Allow permission they do not possess.
const DBP_ERROR_MESSAGE = 'Delegation Bypass Prevention: You cannot grant permissions you do not currently possess.';
class DelegationBypassService {
    // Core validation for DBP algorithm
    // Checks if the requesting user holds all actions listed in Allow statements.
    // Throws AppError(403) on failure.
    async checkAllowStatements(requestingUserId, statements, ctx) {
        for (const statement of statements) {
            // Only validate Allow statements — Deny statements do not escalate privilege
            if (statement.effect !== client_1.Effect.ALLOW) {
                continue;
            }
            for (const action of statement.actions) {
                const held = await evaluation_service_1.permissionService.canPerformAction(requestingUserId, action);
                if (!held) {
                    logger_1.logger.warn('[DBP] Delegation Bypass Prevention blocked', {
                        requestingUserId: ctx.requestingUserId,
                        operation: ctx.operation,
                        policyName: ctx.policyName,
                        policyId: ctx.policyId,
                        failedAction: action,
                        result: 'REJECTED',
                    });
                    throw new AppError_1.AppError(403, DBP_ERROR_MESSAGE);
                }
            }
        }
        logger_1.logger.info('[DBP] Delegation Bypass Prevention passed', {
            requestingUserId: ctx.requestingUserId,
            operation: ctx.operation,
            policyName: ctx.policyName,
            policyId: ctx.policyId,
            result: 'ALLOWED',
        });
    }
    // Synchronous check used for in-memory filtering.
    checkAllowStatementsSync(effectivePerms, statements) {
        for (const statement of statements) {
            if (statement.effect !== client_1.Effect.ALLOW) {
                continue;
            }
            for (const action of statement.actions) {
                if (action === '*') {
                    // If the policy grants '*', the user must have ALL IAM actions
                    const hasAll = iam_constants_1.IAM_ACTIONS.every(a => effectivePerms[a]);
                    if (!hasAll)
                        return false;
                }
                else {
                    // Otherwise, the user must have the specific action
                    if (!effectivePerms[action])
                        return false;
                }
            }
        }
        return true;
    }
    // Public entry points
    // Validates before policy creation.
    async validateForPolicyCreate(requestingUserId, policyName, statements) {
        await this.checkAllowStatements(requestingUserId, statements, {
            requestingUserId,
            operation: 'CreatePolicy',
            policyName,
        });
    }
    // Validates before updating policy statements.
    async validateForPolicyUpdate(requestingUserId, policyId, policyName, statements) {
        await this.checkAllowStatements(requestingUserId, statements, {
            requestingUserId,
            operation: 'UpdatePolicy',
            policyId,
            policyName,
        });
    }
    // Validates before attaching a policy to a user.
    async validateForUserPolicyAttachment(requestingUserId, policyId, organizationId) {
        const policy = await policies_repository_1.policyRepository.findPolicyById(policyId, organizationId);
        if (!policy) {
            // The calling service already validates policy existence and throws 404.
            // Reaching here would be a logic error; re-throw 404 defensively.
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        // Map Prisma PolicyStatement → PolicyStatementDto shape that checkAllowStatements expects
        const statements = policy.statements.map((s) => ({
            effect: s.effect,
            actions: s.actions,
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
    async validateForGroupPolicyAttachment(requestingUserId, policyId, organizationId) {
        const policy = await policies_repository_1.policyRepository.findPolicyById(policyId, organizationId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        const statements = policy.statements.map((s) => ({
            effect: s.effect,
            actions: s.actions,
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
exports.delegationBypassService = new DelegationBypassService();
