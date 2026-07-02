"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundaryController = void 0;
const boundaries_service_1 = require("./boundaries.service");
// Boundary Controller
class BoundaryController {
    // Assigns or replaces a boundary. Root-only.
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
    // Gets current boundary policy.
    async getBoundary(req, res) {
        const targetUserId = req.params.id;
        const boundary = await boundaries_service_1.boundaryService.getBoundary(targetUserId, req.user.orgId);
        res.status(200).json({
            success: true,
            data: boundary, // null when no boundary is set — valid response, not 404
        });
    }
    // Removes boundary. Root-only.
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
