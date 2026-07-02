import { Request, Response } from 'express';
import { boundaryService } from './boundaries.service';

// Boundary Controller

class BoundaryController {
  // Assigns or replaces a boundary. Root-only.
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

  // Gets current boundary policy.
  async getBoundary(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.id as string;

    const boundary = await boundaryService.getBoundary(targetUserId, req.user!.orgId);

    res.status(200).json({
      success: true,
      data: boundary, // null when no boundary is set — valid response, not 404
    });
  }

  // Removes boundary. Root-only.
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
