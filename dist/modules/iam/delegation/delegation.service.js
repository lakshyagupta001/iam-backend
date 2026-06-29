"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegationBypassService = void 0;
const client_1 = require("@prisma/client");
const AppError_1 = require("../../../shared/utils/AppError");
const logger_1 = require("../../../shared/utils/logger");
const evaluation_service_1 = require("../evaluation/evaluation.service");
const policies_repository_1 = require("../policies/policies.repository");
const iam_constants_1 = require("../shared/iam.constants");
// ──────────────────────────────────────────────────────────────────────────────
// Delegation Bypass Prevention Service
//
// Enforces the following security invariant:
//   "A user may never grant an Allow permission they do not currently possess."
//
// This service is intentionally decoupled from IAM middleware. IAM middleware
// checks whether the requester is allowed to call the endpoint (e.g. iam:CreatePolicy).
// This service checks whether the permissions *contained inside* the policy being
// written are permissions the requester already holds themselves.
//
// Both checks must pass independently. This service is the only place this check
// runs — never duplicate this logic in controllers or repositories.
//
// PRD references: §6.2 Delegation Bypass Prevention, §7 (Functional Requirements).
// ──────────────────────────────────────────────────────────────────────────────
const DBP_ERROR_MESSAGE = 'Delegation Bypass Prevention: You cannot grant permissions you do not currently possess.';
class DelegationBypassService {
    // ────────────────────────────────────────────────────────────────────────────
    // Core validation — single source of truth for the DBP algorithm
    // ────────────────────────────────────────────────────────────────────────────
    /**
     * Iterates over every statement in the provided list.
     * For each statement with Effect = ALLOW, checks whether the requesting user
     * holds every action listed in that statement.
     *
     * Per PRD §6.2: "this check applies only to Allow statements, not Deny —
     * denying an action you can't perform isn't privilege escalation."
     *
     * Throws AppError(403) on the FIRST action that fails.
     * Returns void on success (all Allow actions are held by the requester).
     */
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
    /**
     * Synchronous version of checkAllowStatements used for in-memory filtering.
     * Assumes the caller has already computed the user's effective permissions.
     * Returns true if the statements can be delegated, false otherwise.
     */
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
    // ────────────────────────────────────────────────────────────────────────────
    // Public entry points — one per protected operation
    // ────────────────────────────────────────────────────────────────────────────
    /**
     * Called by PolicyService.createPolicy() before any persistence.
     */
    async validateForPolicyCreate(requestingUserId, policyName, statements) {
        await this.checkAllowStatements(requestingUserId, statements, {
            requestingUserId,
            operation: 'CreatePolicy',
            policyName,
        });
    }
    /**
     * Called by PolicyService.updatePolicy() before persisting new statements.
     * Only runs if the update payload includes statements (name-only updates skip DBP).
     */
    async validateForPolicyUpdate(requestingUserId, policyId, policyName, statements) {
        await this.checkAllowStatements(requestingUserId, statements, {
            requestingUserId,
            operation: 'UpdatePolicy',
            policyId,
            policyName,
        });
    }
    /**
     * Called by UsersService.attachPolicy() before creating the attachment row.
     * Loads the policy's current statements from the DB, then validates.
     */
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
    /**
     * Called by GroupService.attachPolicy() before creating the attachment row.
     * Loads the policy's current statements from the DB, then validates.
     */
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
