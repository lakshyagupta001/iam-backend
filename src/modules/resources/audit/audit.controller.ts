import { Request, Response } from 'express';
import { auditService } from './audit.service';

export const auditController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const logs = await auditService.listLogs(organizationId);
    res.json({ success: true, data: logs });
  },
};
