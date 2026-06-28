"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundaryService = void 0;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/utils/AppError");
const logger_1 = require("../../shared/utils/logger");
// ──────────────────────────────────────────────────────────────────────────────
// Boundary Service
//
// Manages assignment, replacement, removal, and retrieval of a user's Permission
// Boundary. A boundary is a MANAGED policy that acts as a hard ceiling on a
// user's effective permissions:
//
//   Allow found in identity/group policies AND Allow found in boundary → ALLOW
//   Allow found in identity/group policies AND NOT in boundary          → DENY
//   Deny found anywhere                                                 → DENY (always)
//   No Allow anywhere                                                   → DENY (implicit)
//
// The boundary is evaluated by the existing PermissionEvaluationService —
// this service ONLY handles CRUD for the boundary assignment record.
//
// PRD §5: PUT/DELETE boundary is root-only (hardcoded isRoot check in the route
// layer). This service itself does not re-enforce that — it trusts the route
// has already verified it.
//
// PRD references: §4 Concept Glossary, §5 User Roles, §6.1 Algorithm Step 4.
// API_REGISTRY references: §4 Users — iam:PutUserBoundary, iam:DeleteUserBoundary.
// ──────────────────────────────────────────────────────────────────────────────
class BoundaryService {
    /**
     * Assigns or replaces the Permission Boundary for a user.
     *
     * - Target user must exist in the organisation.
     * - Boundary policy must exist in the organisation.
     * - Boundary policy must be MANAGED (per PRD §4 "Boundary" definition).
     * - If a boundary already exists it is replaced (upsert). PRD says "Max one
     *   per user. Replacing an existing boundary should update it."
     *
     * Returns the new boundary record with the full policy + statements.
     */
    async assignBoundary(targetUserId, policyId, orgId, requestingUserId) {
        // 1. Verify target user exists in this org
        const user = await client_1.prisma.user.findFirst({
            where: { id: targetUserId, organizationId: orgId },
            select: { id: true, name: true, boundary: { select: { policyId: true } } },
        });
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        // 2. Verify the boundary policy exists in this org
        const policy = await client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId: orgId },
            include: { statements: true },
        });
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        // 3. Boundary must be a MANAGED policy (PRD §4)
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Permission boundaries must be MANAGED policies');
        }
        const previousBoundaryPolicyId = user.boundary?.policyId ?? null;
        // 4. Upsert — replaces any existing boundary atomically
        const boundary = await client_1.prisma.userBoundary.upsert({
            where: { userId: targetUserId },
            create: { userId: targetUserId, policyId },
            update: { policyId },
            include: {
                policy: {
                    include: { statements: true },
                },
            },
        });
        logger_1.logger.info('[Boundary] Boundary assigned', {
            requestingUserId,
            targetUserId,
            targetUserName: user.name,
            newBoundaryPolicyId: policyId,
            newBoundaryPolicyName: policy.name,
            previousBoundaryPolicyId,
            result: previousBoundaryPolicyId ? 'REPLACED' : 'ASSIGNED',
        });
        return boundary;
    }
    /**
     * Retrieves the current Permission Boundary for a user.
     * Returns null if no boundary is set (not an error — boundaries are optional).
     */
    async getBoundary(targetUserId, orgId) {
        // Verify user exists in this org first
        const user = await client_1.prisma.user.findFirst({
            where: { id: targetUserId, organizationId: orgId },
            select: { id: true },
        });
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const boundary = await client_1.prisma.userBoundary.findUnique({
            where: { userId: targetUserId },
            include: {
                policy: {
                    include: { statements: true },
                },
            },
        });
        // null = no boundary set (valid state — not a 404)
        return boundary;
    }
    /**
     * Removes the Permission Boundary from a user.
     * Throws 404 if no boundary is currently assigned.
     */
    async removeBoundary(targetUserId, orgId, requestingUserId) {
        // Verify user exists in this org
        const user = await client_1.prisma.user.findFirst({
            where: { id: targetUserId, organizationId: orgId },
            select: { id: true, name: true },
        });
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        // Check boundary exists before trying to delete
        const existing = await client_1.prisma.userBoundary.findUnique({
            where: { userId: targetUserId },
            include: { policy: { select: { id: true, name: true } } },
        });
        if (!existing) {
            throw new AppError_1.AppError(404, 'No boundary is currently assigned to this user');
        }
        await client_1.prisma.userBoundary.delete({
            where: { userId: targetUserId },
        });
        logger_1.logger.info('[Boundary] Boundary removed', {
            requestingUserId,
            targetUserId,
            targetUserName: user.name,
            removedBoundaryPolicyId: existing.policyId,
            removedBoundaryPolicyName: existing.policy.name,
            result: 'REMOVED',
        });
    }
}
exports.boundaryService = new BoundaryService();
