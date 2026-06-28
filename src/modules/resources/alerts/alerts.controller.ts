import { Request, Response } from 'express';
import { alertsService } from './alerts.service';

export const alertsController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const alerts = await alertsService.listAlerts(organizationId);
    res.json({ success: true, data: alerts });
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

  async update(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    const alert = await alertsService.updateAlert(organizationId, id as string, req.body);
    res.json({ success: true, data: alert });
  },

  async delete(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    await alertsService.deleteAlert(organizationId, id as string);
    res.json({ success: true, message: 'Alert deleted successfully' });
  },
};
