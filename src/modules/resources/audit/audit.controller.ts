import { Request, Response } from 'express';
import { auditService } from './audit.service';
import { getPaginationParams, formatPaginatedResponse } from '../../../shared/utils/pagination';

export const auditController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const params = getPaginationParams(req.query);
    const { totalItems, logs } = await auditService.listLogs(organizationId, params);
    res.json({ 
      success: true, 
      ...formatPaginatedResponse(logs, totalItems, params.page, params.limit)
    });
  },
};
