"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundaryController = void 0;
const boundaries_service_1 = require("./boundaries.service");
// ──────────────────────────────────────────────────────────────────────────────
// Boundary Controller
//
// Thin HTTP adapter. Parses the request, delegates to BoundaryService, shapes
// the response. Contains zero business logic.
// ──────────────────────────────────────────────────────────────────────────────
class BoundaryController {
    /**
     * PUT /api/iam/users/:id/boundary
     * Assigns or replaces the Permission Boundary for the target user.
     * Root-only (enforced at route level via requireRoot).
     */
    async assignBoundary(req, res) {
        const targetUserId = req.params.id;
        const { policyId } = req.body;
        const boundary = await boundaries_service_1.boundaryService.assignBoundary(targetUserId, policyId, req.user.orgId, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Permission boundary assigned successfully',
            data: boundary,
        });
    }
    /**
     * GET /api/iam/users/:id/boundary
     * Returns the current boundary policy (or null if none is set).
     * Protected by iamCheck('iam:GetUser').
     */
    async getBoundary(req, res) {
        const targetUserId = req.params.id;
        const boundary = await boundaries_service_1.boundaryService.getBoundary(targetUserId, req.user.orgId);
        res.status(200).json({
            success: true,
            data: boundary, // null when no boundary is set — valid response, not 404
        });
    }
    /**
     * DELETE /api/iam/users/:id/boundary
     * Removes the boundary from the target user.
     * Root-only (enforced at route level via requireRoot).
     */
    async removeBoundary(req, res) {
        const targetUserId = req.params.id;
        await boundaries_service_1.boundaryService.removeBoundary(targetUserId, req.user.orgId, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Permission boundary removed successfully',
        });
    }
}
exports.boundaryController = new BoundaryController();
