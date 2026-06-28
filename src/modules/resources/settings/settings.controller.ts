import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { getPaginationParams, formatPaginatedResponse } from '../../../shared/utils/pagination';

export const settingsController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const params = getPaginationParams(req.query);
    const { totalItems, settings } = await settingsService.listSettings(organizationId, params);
    res.json({ 
      success: true, 
      ...formatPaginatedResponse(settings, totalItems, params.page, params.limit)
    });
  },

  async update(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { key, value } = req.body;
    const setting = await settingsService.updateSetting(organizationId, { key, value });
    res.json({ success: true, data: setting });
  },
};
