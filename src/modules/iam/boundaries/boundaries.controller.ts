import { Request, Response } from 'express';
import { boundaryService } from './boundaries.service';

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
  async assignBoundary(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.id as string;
    const { policyId } = req.body;

    const boundary = await boundaryService.assignBoundary(
      targetUserId,
      policyId,
      req.user!.orgId,
      req.user!.id
    );

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
  async getBoundary(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.id as string;

    const boundary = await boundaryService.getBoundary(targetUserId, req.user!.orgId);

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
  async removeBoundary(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.id as string;

    await boundaryService.removeBoundary(
      targetUserId,
      req.user!.orgId,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'Permission boundary removed successfully',
    });
  }
}

export const boundaryController = new BoundaryController();
