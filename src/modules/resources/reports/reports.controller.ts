import { Request, Response } from 'express';
import { reportsService } from './reports.service';

export const reportsController = {
  async list(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const reports = await reportsService.listReports(organizationId);
    res.json({ success: true, data: reports });
  },

  async get(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    const report = await reportsService.getReport(organizationId, id as string);
    res.json({ success: true, data: report });
  },

  async create(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const report = await reportsService.createReport(organizationId, req.body);
    res.status(201).json({ success: true, data: report });
  },

  async update(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    const report = await reportsService.updateReport(organizationId, id as string, req.body);
    res.json({ success: true, data: report });
  },

  async delete(req: Request, res: Response) {
    const { orgId: organizationId } = req.user!;
    const { id } = req.params;
    await reportsService.deleteReport(organizationId, id as string);
    res.json({ success: true, message: 'Report deleted successfully' });
  },
};
