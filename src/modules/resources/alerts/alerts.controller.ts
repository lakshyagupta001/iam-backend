import { Request, Response } from 'express';
import { alertsService } from './alerts.service';
import { getPaginationParams, formatPaginatedResponse } from '../../../shared/utils/pagination';

export const alertsController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const params = getPaginationParams(req.query);
    const { totalItems, alerts } = await alertsService.listAlerts(organizationId, params);
    res.json({ 
      success: true, 
      ...formatPaginatedResponse(alerts, totalItems, params.page, params.limit)
    });
  },

  async get(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    const alert = await alertsService.getAlert(organizationId, id as string);
    res.json({ success: true, data: alert });
  },

  async create(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const alert = await alertsService.createAlert(organizationId, req.body);
    res.status(201).json({ success: true, data: alert });
  },

  async acknowledge(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    const alert = await alertsService.acknowledgeAlert(organizationId, id as string);
    res.json({ success: true, data: alert });
  },

  async delete(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    await alertsService.deleteAlert(organizationId, id as string);
    res.json({ success: true, message: 'Alert deleted successfully' });
  },
};
