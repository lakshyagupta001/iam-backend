import { Request, Response } from 'express';
import { settingsService } from './settings.service';

export const settingsController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const settings = await settingsService.listSettings(organizationId);
    res.json({ success: true, data: settings });
  },

  async update(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { key, value } = req.body;
    const setting = await settingsService.updateSetting(organizationId, { key, value });
    res.json({ success: true, data: setting });
  },
};
